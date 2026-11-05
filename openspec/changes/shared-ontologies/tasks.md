## 1. Model

- [x] 1.1 Add optional `shared` to `OntologySummary`

## 2. Ontologies panel

- [x] 2.1 `OntologiesPanelItem.shared` and `shared`/`sharedTitle` labels in `OntologiesPanelDS`
- [x] 2.2 Badge next to the name in `ontologies-panel.html`, styles in `_ontologies-panel.scss`
- [x] 2.3 i18n `ontologiespanel#shared` and `ontologiespanel#shared_title` in `en_US.ts`

## 3. Tests

- [x] 3.1 Panel DS: badge for `shared: true`, none for false or missing
- [x] 3.2 Ontology service: saved selection includes the shared id while checked
- [x] 3.3 Warning toast: no warning when only the shared ontology is selected for predicates

## 4. Warning toasts

- [x] 4.1 `hasUsableOntologies` → `hasImportedOntologies`, ignoring shared ontologies (spec)
- [x] 4.2 `warnIfNoOntologyPredicates`: import toast when only the shared ontology exists and is deselected (spec)

## 5. Verification

- [x] 5.1 `npm test` and `npm run lint` green
