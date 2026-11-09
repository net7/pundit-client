## ADDED Requirements

### Requirement: Single warning toast for missing predicates
When the semantic section opens with the ontology list loaded and no ontology (shared included) used for predicates, the client SHALL show one "No predicates selected" warning toast with a single "Select ontologies" button that opens the Ontologies panel. When some ontology is used for predicates, or the list is not loaded, no toast SHALL show.

#### Scenario: Default selection needs no warning
- **WHEN** the only ontology used for predicates is the shared one, selected by default
- **THEN** opening the semantic section shows no toast

#### Scenario: No predicates selected
- **WHEN** the user has deselected every ontology used for predicates
- **THEN** opening the semantic section shows the "No predicates selected" toast, and its only button opens the Ontologies panel
