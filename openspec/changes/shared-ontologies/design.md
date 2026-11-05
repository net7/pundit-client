## Context

`OntologySummary` mirrors `GET /ontologies` entries; `OntologiesPanelDS` maps them to panel items; `OntologyService` holds the selection and sends `PUT /ontologies/selection` with every checked ontology. The server now adds a shared "Pundit predicates" ontology, first in the list, selected by default.

## Goals / Non-Goals

**Goals:**
- Model the `shared` flag and mark shared ontologies in the panel.
- Invite to import ontologies from the panel; keep a single, simple warning toast.

**Non-Goals:**
- Changing selection, search, predicate picker, `SemanticPredicateModel` or AI mapping.
- Hiding or locking the shared ontology.

## Decisions

### D1. `shared?: boolean`, optional
Optional in the model, read as `!!ontology.shared`, so a server not yet sending the field still works: the ontology is listed as the user's own, without badge.

### D2. Sections as in the notebook panel
The panel uses the notebook panel pattern: `section` blocks separated by a border, a `pnd-text` label on top, `pnd-text-small` secondary text. The import section mirrors "Share notebook": label, `pnd-btn` with the `plus` icon (same paddings as the share button), description. The button is an `<a>` styled as `pnd-btn`, since it navigates to the import page in a new tab. Without `ontologiesLink` the section is not rendered.

### D3. One list, built-in ontologies last
`OntologiesPanelData` has one `items` list (own ontologies first, shared last, server order within each group) and `hasOwn`. Shared items carry `shared: true` and show a `pnd-type-badge` "Built-in"; the tooltip uses the backend wording "Provided by Pundit". When `hasOwn` is false, a `pnd-text-small` line "You haven't imported any ontology yet." opens the list. The previous panel-wide empty message is gone.

### D4. Selection unchanged
The shared ontology goes through `toggle`/`toggleCategory` and `currentSelection` like the others. Tests pin that its id is in the saved payload.

### D5. One warning toast, one button
`warnIfNoOntologyPredicates` shows only the "No predicates selected" toast, with one "Select ontologies" button opening the Ontologies panel; importing is reached from the panel's import section. The "No ontologies yet" toast and `OntologyService.hasUsableOntologies` are removed.

### D6. Selection persistence is the server's
The server returns a saved selection as saved, empty included; only a user who never saved one gets the default with the shared ontology selected. The client keeps showing what the server confirms, so a deselected shared ontology stays deselected.

## Risks / Trade-offs

- [Older server still resetting an empty selection to the default] → the shared ontology would come back checked after the save; harmless, it goes away with the server behaviour of D6.
