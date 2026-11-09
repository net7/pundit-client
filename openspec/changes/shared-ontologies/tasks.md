## 1. Model

- [x] 1.1 Add optional `shared` to `OntologySummary`

## 2. Ontologies panel

- [x] 2.1 `OntologiesPanelDS`: one `items` list (own first, shared last), `shared` per item, `hasOwn`, section and badge labels
- [x] 2.2 Template: "Import ontologies" section (button + description) and "Available ontologies" section with the item `ng-template`, Built-in badge, no-own line
- [x] 2.3 Styles in `_ontologies-panel.scss`, following the notebook panel sections and share button
- [x] 2.4 i18n: `ontologiespanel#import_title`, `#import`, `#import_description`, `#list_title`, `#own_empty`, `#shared_badge`, `#shared_title`; remove `#empty`, `#empty_link`

## 3. Warning toast

- [x] 3.1 `warnIfNoOntologyPredicates`: single "No predicates selected" toast with one button to the panel
- [x] 3.2 Remove the "No ontologies yet" toast keys and `hasUsableOntologies`; update the toast text

## 4. Tests

- [x] 4.1 Panel DS: order (own first, shared last), `shared` flag, `hasOwn`
- [x] 4.2 Panel component: import section and its absence without link, Built-in badge, no-own line
- [x] 4.3 Ontology service: saved selection includes the shared id while checked
- [x] 4.4 Warning toast: one button opening the panel, no toast with the shared default selection

## 5. Verification

- [x] 5.1 `npm test`, `npm run lint` and type-check green
