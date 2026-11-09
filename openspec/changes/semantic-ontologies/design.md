## Context

- **Design**: Figma `Pundit-3-UX-V1.2`, page "Semantic annotation" (`301:1944`). Frames 1–10 (`304:1832` … `328:4568`) show the edit modal flow: predicate dropdown with source links (frame 4), object typing → loader → results with ENTITY/CLASS badges (frames 14, 6), picked ENTITY/CLASS shown in the input (frames 7, 9), free text kept as LITERAL (frame 10). Frame 11 (`328:5029`) shows the sidebar Ontologies panel: checkbox, name, source, TYPES badges. Connectors (Wikipedia, DBpedia…) in the design are out of scope: only the user's ontologies are listed.
- **Current semantic section** (`semantic-section.ts`): standalone, OnPush, immutable `rows` updates; predicates come from `SemanticPredicateService` (Pundit's built-in list) through `SemanticGenericProvider`; objects are free text, typed `literal`/`uri` by `getObjectType`. Rows whose `_raw` object is a `search` URI or a date are disabled.
- **Saving**: `EditModalPayloadBuilder.getSemanticContentRow` maps rows to `SemanticTripleType`; rows with `rdfTypes` are passed through unchanged (legacy). Reopening: `MainLayoutAppEventsHandler.getSemanticData`.
- **Communication pattern** (as `ai.annotate`): `src/communication/<ns>` function on `apiBaseUrl` with `refreshHook` → `src/common/models/<x>-model.ts` with `@CrossMessage` → background `doCrossMessageRequest` entry → `src/app/services/<x>.service.ts` (`providedIn: 'root'`).
- **Sidebar panel pattern**: `notebook-panel` widget — standalone OnPush component, `NotebookPanelDS`/`NotebookPanelEH` in `data-sources`/`event-handlers`, registered in `SidebarLayoutConfig.widgets`, opened by a `BehaviorSubject` on `SidebarLayoutDS`, toggled in `SidebarLayoutEH.innerEventHandlers`, outer events handled by a `SidebarLayout*Handler`.
- **Icons**: `pnd-svg-icon` renders inline SVG by id (`svg-icon.html` `@switch`).
- **Server**: ontologies are imported and stored per user by the Pundit dashboard; each element has a category (predicate, class or entity). Annotation bodies are validated strictly: unknown fields are rejected.

## Goals / Non-Goals

**Goals:**
- Implement panel, predicate autocomplete and object autocomplete as in the design, on current patterns (standalone, OnPush, `@if/@for`, strict types, immutable rows).
- Let the user choose, per ontology, the categories used in the annotator.
- Persist `elementType` so the badge survives a reload; store nothing that links a triple to an ontology.

**Non-Goals:**
- External connectors (Wikipedia, DBpedia, Geonames, NIF, FOAF).
- Showing badges in the sidebar annotation cards (they keep rendering triples as today).
- Using ontologies in AI-generated semantic annotations.
- Managing ontologies (import, delete) from the client: that stays in the dashboard.
- Per-notebook selection.
- Swapping subject and object of a triple.

## Decisions

### D1. Communication namespace `ontology` on `apiBaseUrl`
Three functions in `src/communication/ontology/`: `list()`, `saveSelection({ ontologies })`, `searchElements({ query, categories, limit })`, all with `baseURL: CommunicationSettings.apiBaseUrl` and `hooks: { after: refreshHook }`, like `ai.annotate`. The client keeps one server, one token and the Chrome-extension background path. `GetRequestOptions` gains `params` for the search query string.

### D2. Model with cross-message
`OntologyModel` (`src/common/models/ontology-model.ts`) has `@CrossMessage` methods `list`, `saveSelection`, `searchElements` (`CrossMsgRequestId.Ontology*`), registered in `doCrossMessageRequest.ts`, so the Chrome extension calls the server from its background page as for the other models.

### D3. Server contract
```
GET  {apiBaseUrl}/ontologies
  200 { data: OntologySummary[] }          // the user's ready ontologies
PUT  {apiBaseUrl}/ontologies/selection     body { ontologies: { id: string; categories: Category[] }[] }
  200 { data: { ontologies: { id; categories }[] } }   // what was saved: unknown ids and
                                                       // categories without elements dropped
GET  {apiBaseUrl}/ontologies/elements?q=<text>&categories=class,entity&limit=20
  200 { data: OntologyElement[] }          // searched only in the user's selected ontologies,
                                           // each in its selected categories ∩ `categories`

OntologySummary = { id: string; name: string; prefix?: string;   // e.g. "foaf"
                    counts: { predicate: number; class: number; entity: number };
                    selected: boolean;                          // = selectedCategories not empty
                    selectedCategories: ('predicate'|'class'|'entity')[] }
OntologyElement = { uri: string; label: string;
                    category: 'predicate' | 'class' | 'entity';
                    description?: string;
                    ontology: { name: string; prefix?: string } }
```
`q` is required (at least 1 character). The **source label** shown by the client is the same everywhere: the ontology `prefix` when present, otherwise its `name` (helper `getOntologySourceLabel`). In the panel the prefix is shown beside the name, omitted when it equals the name; in the predicate and object dropdowns it is the text of the external link.
Errors: 401 handled by `refreshHook`; any other error is treated as "no data" by the UI (D6, D8). The selection is stored on the server so the search is restricted there without the client sending ids (the client never needs to know which ontology an element comes from).

### D4. `OntologyService` holds the state
`src/app/services/ontology.service.ts` (`providedIn: 'root'`): `ontologies$`, `status$` (`idle | loaded | error`), `savingIds$`, `saveError$`, `openPanel$`; `load()`, `hasUsableOntologies()`, `hasSelection(categories)`, `toggle(id)`, `toggleCategory(id, category)`, `search(query, categories)`, `clear()`.
- `toggle(id)` selects all the categories the ontology has elements of (counts > 0), or none; `toggleCategory` flips one, and an ontology with no selected category is unselected. Listed and saved selections are clamped to the categories with elements.
- Changes update `ontologies$` at once and are saved after 500 ms, so rapid toggles send one request with the full selection. Saves run in order; the answer of the server is applied unless the user changed the selection again meanwhile. On error the last saved selection is restored and `saveError$` emits (error toast). `savingIds$` lists the ontologies changed and not yet saved, for the per-row loader.
- `search` waits for a pending save (flushing the delay) so the server already knows the selection the user sees, and returns `[]` without a request when no ontology is selected for the requested categories.

### D5. Loading and reset
`MainLayoutDS.getUserOntologies()` (`ontologyService.load()`) is appended to the `GetUserData` chain after `getUserSemanticPredicates()`; `load` catches its own errors (status `error`, empty list), so a failure never reaches `handleError` and never logs the user out. `resetAppData` calls `ontologyService.clear()`; the sidebar handler closes the panel when the status goes back to `idle`.

### D6. Ontologies panel widget
Component `src/app/components/ontologies-panel/` (selector `ontologies-panel`, standalone, OnPush, `@Input data`, `@Input emit`) rendering title, description, rows, empty state (link to `_c('ontologiesLink')`, an optional `LocalConfig` field; no link when unset) and error state. Each row: a checkbox (custom, `checked` icon) replaced by a loader while the row is saving, the name with the prefix beside it, and under them one checkbox per category with its label (coloured like the type badges), its count and a tooltip ("Use classes from foaf"); a category with no elements is unchecked and disabled. `OntologiesPanelDS.transform` hides ontologies without elements and derives the category states; `OntologiesPanelEH` emits `OntologiesPanelEvent.Toggle` (id) and `ToggleCategory` ({ id, category }).
`SidebarLayoutOntologiesPanelHandler` forwards the events to the service, re-renders the panel from `ontologies$`/`status$`/`savingIds$`, shows the error toast on `saveError$`, and on `openPanel$` expands the sidebar, closes the notebook panel and opens the Ontologies panel. `SidebarLayoutDS.ontologiesPanel = new BehaviorSubject(false)`; `SidebarLayoutEH` handles `SidebarLayoutEvent.ClickOntologiesPanel`, closes the other panel in both directions and closes the panel when the sidebar collapses. Like the notebook panel, the panel is a card over the sidebar (`max-height` with scroll); while it is open the annotations below are hidden (`has-ontologies-panel-open`).

### D7. Predicate autocomplete
The predicate is an `<input role="combobox">` inside `.pnd-dropdown__selected` showing the selected label, with the chevron as a button. Options come only from the ontologies: a per-section `Subject<{ rowIndex, query }>` → `debounceTime(300)` → `switchMap` to `ontologyService.search(query, ['predicate'])` (at least 1 character, errors → no results) fills `predicate.remote` for that row, with a loader while pending, then the options or "no predicate found"; with an empty field the list shows a hint to type. The picked option is kept on the row (`predicate.picked: SemanticItem`, with `sourceLabel`); Escape and blur restore it, Enter picks the first option, free text is never accepted. A new row has no predicate and a row without predicate is not emitted. Link clicks call `stopPropagation()` so opening the URI does not pick the option. A stored triple reopens with its `{ label, uri }` as the picked predicate, so built-in predicates of older annotations are kept. The section no longer reads `SemanticPredicateService`.

### D8. Object autocomplete
Rows get a stable `id` (counter) and the template tracks by it (`@for (row of rows; track row.id)`): with `track row`, every immutable replacement would recreate the row's DOM and drop focus and open dropdowns on each keystroke or search answer. Row object state adds `isExpanded`, `isLoading`, `options: OntologyElement[]`, `picked: OntologyElement | null`. `onObjectChange` clears `picked`, keeps today's `getObjectType` typing and pushes `{ rowIndex, query }` into a second `Subject` → `debounceTime(300)` → `switchMap` (stale answers dropped) → `ontologyService.search(query, ['class', 'entity'])` with errors → no results. With an empty field or no selection the dropdown closes and nothing is sent. The dropdown reuses `.pnd-dropdown` markup (positioned under the input) with `pnd-loader` while loading, then options and the trailing "Use "x" as literal|uri" item. Escape, blur (with a short delay so a click can land) and the default item close it keeping the text. Picking sets `picked`, `value = label`, and the indicator shows `elementType`. Pure row logic lives in `semantic-section.utils.ts`.

### D9. Warnings when the semantic section opens
`warnIfNoOntologyPredicates` (called by `MainLayoutDS.openEditModal` when the sections include `semantic`) shows a warning toast that stays open, only when the list is loaded and no ontology is used for predicates: no ontology with elements → button opening `ontologiesLink` in a new tab; otherwise → button that emits `OntologyService.openPanel$`.

### D10. Form value, payload and reopening
The section emits, for a row with a picked object, `{ predicate, objectType: 'uri', object: { label, uri, source: 'search', elementType: picked.category } }`. `EditModalPayloadBuilder.getObjectPayload` has a `source === 'search'` branch producing `{ objectType: 'uri', object: { uri, label, source: 'search', elementType?, rdfTypes? } }`. `getSemanticData` copies `source`, `elementType` and `rdfTypes` into the row object; the section rebuilds the picked object from them. `isDisabled` keeps only dates. Legacy `search` URIs with `rdfTypes` and no `elementType` become editable, shown with their `altValue` as today.

**Unedited triples are saved as-is.** There are two save paths: when the section never emits, the modal saves the `initialValue` rows built by `getSemanticData` (`{ predicate, object, objectType, _raw }`); when it emits, the rows come from the section. Today the first path rewrites a `search` URI triple as a free-text URI with `uri = label` (the `rdfTypes` pass-through never matches). Rule, applied in `EditModalPayloadBuilder.getSemanticContentRow`: a row carrying `_raw` is returned as its `_raw` triple. Rows emitted by the section carry `_raw` only when unedited (an edited row drops `_raw` in `replaceRow`), and disabled date rows keep it. The communication `ObjectUri` type gains `elementType?: 'class' | 'entity'`.

### D11. Icons and styles
Add `ontologies`, `external-link`, `checked` to `svg-icon.html` (20×20 viewBox conventions). Badge colours as tokens in `_color-scheme.scss` (entity blue, class yellow, predicate purple, literal/uri grey, as in Figma), shared `.pnd-type-badge--<type>` rules; new `_ontologies-panel.scss`; autocomplete additions in `_edit-modal.scss`.

## Risks / Trade-offs

- [Ontologies with thousands of elements] → never listed whole: results only while typing, capped by `limit`.
- [Debounced selection save lost if the tab closes within 500 ms] → acceptable; the panel reflects the server state on next load.
- [Server without `elementType` support] → saving a picked object would be rejected; the server must accept the field before the feature is released.
- [Dropdown inside the modal's shadow DOM and overflow] → reuse the predicate dropdown's z-index and positioning; check in embed and Chrome extension.
- [Two `Subject` pipelines per section, one search per keystroke burst] → per-section, `switchMap` cancels in-flight requests, torn down with `destroy$`.

## Migration Plan

1. Release after the server exposes the endpoints of D3 and accepts `elementType`; no data migration (optional field).
2. Set `ontologiesLink` in each environment's `LocalConfig`.
Rollback: revert the client release; saved annotations stay valid (an extra optional `elementType` is ignored by older clients).
