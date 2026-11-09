## Why

Semantic annotations today can only use Pundit's nine built-in predicates and a free-text object (literal or hand-typed URI). Users can import their own ontologies in the Pundit dashboard, so the annotator should let them build triples with the predicates, classes and entities of those ontologies, as in the Pundit 3 UX design ("Semantic annotation" page, Figma `Pundit-3-UX-V1.2`).

## What Changes

- New **Ontologies** action in the sidebar header (graph icon), shown to logged users, that opens an **Ontologies panel** (a card over the sidebar, mutually exclusive with the notebook panel). The panel lists the user's ontologies that have elements: a checkbox, the name with its prefix beside it, and under them one checkbox per category (ENTITY, CLASS, PREDICATE) with its number of elements. The selection, per ontology and per category, is saved on the server for the user.
- The **predicate** of a semantic row becomes an autocomplete over the predicates of the ontologies used for predicates: no built-in options, no free text, a new row starts empty. Every option shows its source and an external link to its URI.
- When the semantic section opens, a **warning toast** invites the user without ontologies to import one, or the user with no ontology used for predicates to select one in the Ontologies panel.
- The **object** input gains an autocomplete over the classes and entities of the selected ontologies (loader while searching, label + source link + ENTITY/CLASS badge per result). Free text and hand-typed URIs keep working as today.
- An object picked from the autocomplete is saved as `objectType: 'uri'`, `source: 'search'`, with `uri`, `label` and the optional `elementType: 'class' | 'entity'`. No reference to the source ontology or element is stored.
- Triples whose object is a URI from search are editable in the edit modal; they reopen with their label and badge (ENTITY/CLASS from `elementType`, URI when absent).
- Fix: a semantic row the user did not edit is saved exactly as stored. Today, reopening and saving an annotation rewrites a `search` URI triple as a free-text URI whose `uri` is its label.
- New communication namespace `ontology` (list, save selection, search elements), model with cross-message, background dispatcher entries and a service.
- New SVG icons `ontologies`, `external-link`, `checked` in `pnd-svg-icon`.

## Capabilities

### New Capabilities
- `semantic-ontologies-panel`: the sidebar Ontologies panel — listing the user's ontologies, selecting the ontologies and categories in use, persisting the selection per user, empty and error states.
- `semantic-ontology-terms`: using the selected ontologies inside the semantic section — predicate autocomplete, warnings, object autocomplete, how picked terms are saved and reopened, and the coexistence with free-text objects.

### Modified Capabilities
- `in-repo-communication-layer`: the public API gains the `ontology` namespace (the "Behavior-preserving import" requirement lists the exposed namespaces).

## Impact

- New code: `src/communication/ontology/*` and request/response models, `src/common/models/ontology-model.ts`, `src/app/services/ontology.service.ts`, `src/app/components/ontologies-panel/*`, `ontologies-panel` DS/EH, sidebar handler, warning toast util, styles, specs.
- Affected code: `semantic-section.ts/html` (+ `semantic-section.utils.ts`), `edit-modal-payload.builder.ts`, `main-layout-app-events.handler.ts` (`getSemanticData`, logout reset), `main-layout.eh.ts`/`main-layout.ds.ts` (load at login, warning), sidebar layout (template, DS, EH, config), `svg-icon.html`, `src/common/types.ts`, `doCrossMessageRequest.ts`, `src/testing/communication.mock.ts`, `en_US.ts`, `LocalConfig` (`ontologiesLink`), styles.
- Server: the three ontology endpoints of design D3, and `elementType` accepted on URI objects.
- Annotations already saved are unchanged; old URI triples with `rdfTypes` keep their current label.
