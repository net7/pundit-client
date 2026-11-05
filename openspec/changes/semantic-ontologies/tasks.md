## 1. Baseline

- [x] 1.1 On `feature/semantic-ontologies` (from `develop`) record a green baseline: `tsc --noEmit` on the tsconfig projects, `npm run lint`, `npm test`, `npm run build:chrome-ext-stage` (Node 22.22.3, see `.node-version`)

## 2. Communication layer

- [x] 2.1 Add `OntologySummary`, `OntologySelection`, `OntologyElement`, `OntologyElementCategory`, `OntologySearchRequest`, `OntologySelectionRequest` and the response types in `src/communication/model/{entity,request,response}` and export them
- [x] 2.2 Add `elementType?: 'class' | 'entity'` to `ObjectUri` in `src/communication/model/entity/triple.ts`
- [x] 2.3 Add `src/communication/ontology/{list,save-selection,search-elements,index}.ts` (routes of design D3, `apiBaseUrl`, `refreshHook`, `params` in `GetRequestOptions`) and export `ontology` from `src/communication/index.ts`
- [x] 2.4 Add the `ontology` namespace to `src/testing/communication.mock.ts`
- [x] 2.5 Add specs for the three functions (URL, method, params/body, baseURL, refreshHook; `request$` mocked)

## 3. Model and chrome-extension background

- [x] 3.1 Add `CrossMsgRequestId.OntologyList`, `OntologySaveSelection`, `OntologySearchElements` in `src/common/types.ts`
- [x] 3.2 Add `src/common/models/ontology-model.ts` with `@CrossMessage` methods; export it from `src/common/models/index.ts`
- [x] 3.3 Register the three request ids in `doCrossMessageRequest.ts`

## 4. Service and loading

- [x] 4.1 Add `src/app/services/ontology.service.ts` (design D4: state, `toggle`/`toggleCategory` with delayed save, rollback, `savingIds$`, `search` gated per category and waiting for a pending save) and its spec
- [x] 4.2 Inject `OntologyService` in `MainLayoutComponent`/`MainLayoutDS` and `SidebarLayoutComponent`/`SidebarLayoutDS`; add `getUserOntologies()` to the `GetUserData` chain (errors caught in `OntologyService.load`)
- [x] 4.3 Clear the service in `resetAppData`; spec in `main-layout-app-events.handler.spec.ts`

## 5. Ontologies panel

- [x] 5.1 Add `ontologies`, `checked` icons, badge colour tokens in `_color-scheme.scss`, `_ontologies-panel.scss` and the sidebar styles (panel open hides the annotations)
- [x] 5.2 Add the `ontologies-panel` component: rows with checkbox or saving loader, name and prefix, category checkboxes with counts; empty state (optional `ontologiesLink` in `LocalConfig` and `local.example.ts`) and error state
- [x] 5.3 Add `OntologiesPanelDS` (ontologies without elements hidden, category states) / `OntologiesPanelEH`, `OntologiesPanelEvent.Toggle`/`ToggleCategory`, export them from the indexes, add the widget to `SidebarLayoutConfig`
- [x] 5.4 Add the sidebar action, `ontologiesPanel` state, `SidebarLayoutEvent.ClickOntologiesPanel` with mutual exclusion with the notebook panel, closing on sidebar collapse, and the panel template outlet
- [x] 5.5 Add `SidebarLayoutOntologiesPanelHandler` (events → service, panel re-render, error toast, `openPanel$`)
- [x] 5.6 Add i18n keys (`ontologiespanel#*`, `sidebaractions#ontologiespanel_*`, `toast#ontologies_save_error_*`)
- [x] 5.7 Add specs for `OntologiesPanelDS` and the mutual exclusion of the panels

## 6. Semantic section

- [x] 6.1 Extend `SemanticFormRow` (stable `id` tracked by `@for`, predicate `query`/`remote`/`picked`/`searched`/`isLoading`, object `isExpanded`/`isLoading`/`options`/`picked`), keep row updates immutable, drop `_raw` when the user edits a row; pure row logic in `semantic-section.utils.ts`
- [x] 6.2 Predicate autocomplete over the ontologies only (design D7): combobox input, debounced search from 1 character, loader, hint and "no results" messages, source label + external link per option, no free text, new row without predicate
- [x] 6.3 Object autocomplete (design D8): debounced search from 1 character with `switchMap`, loader, results with badges and links, trailing "Use … as …" item, Escape/blur handling, clearing `picked` on edit
- [x] 6.4 Emit picked objects with `source: 'search'` and `elementType`; rebuild picked predicate and object when reopening; `isDisabled` keeps only dates; indicator shows ENTITY/CLASS/URI/LITERAL
- [x] 6.5 `getSemanticData` copies `source`, `elementType`, `rdfTypes`; `EditModalPayloadBuilder` saves a row with `_raw` as `_raw` and has the `source: 'search'` branch
- [x] 6.6 Warning toast when the semantic section opens (design D9)
- [x] 6.7 `external-link` icon, type badges, `_edit-modal.scss` additions; i18n keys (`editmodal#semantic_predicate_*`, `editmodal#semantic_default_option`, `editmodal#semantic_open_uri`, `semantic#type_*`, `toast#ontologies_missing_*`, `toast#ontologies_no_predicates_*`)
- [x] 6.8 Specs: utils, payload builder (picked class/entity, free text, unedited `_raw` rows incl. legacy rdfTypes and search URIs), `getSemanticData`, semantic section (stale answers discarded, no search without selection or text, edit clears picked, new row empty, stored predicate reopened), warning toast

## 7. Verification

- [x] 7.1 `tsc --noEmit`, `npm run lint`, `npm test`, `npm run build:chrome-ext-stage` green; `app.component.spec` hook timeout raised to 30 s (it compiles the whole stylesheet)
- [ ] 7.2 Manual check against the local server in the embed build: panel selection per category, predicate search, object autocomplete, warnings, save and reopen a class and an entity, legacy annotation reopen
