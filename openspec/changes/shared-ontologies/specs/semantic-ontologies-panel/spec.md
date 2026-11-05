## ADDED Requirements

### Requirement: Import section
When the import page link is configured, the Ontologies panel SHALL show an "Import ontologies" section, before the list, with a "+ Import an ontology" button opening the import page in a new tab and a description under it. Without the link, the section SHALL NOT show.

#### Scenario: Import page configured
- **WHEN** the panel opens and the import page link is configured
- **THEN** the "Import ontologies" section shows the button and its description above the list

#### Scenario: Import page not configured
- **WHEN** the import page link is not configured
- **THEN** the panel shows no import section and no import link

### Requirement: Built-in ontologies in the list
The "Available ontologies" list SHALL show the user's ontologies first and the ontologies with `shared: true` last, each group in the server order. A shared ontology SHALL show a "Built-in" badge next to its name, with a tooltip saying it is provided by Pundit to every user and cannot be edited or deleted. Checkboxes and categories SHALL behave as for any other ontology, and a shared ontology's id SHALL be part of the selection sent to the server while it is checked.

#### Scenario: Built-in badge and order
- **WHEN** the server lists "Pundit predicates" with `shared: true` before FOAF without `shared`
- **THEN** the list shows FOAF first and "Pundit predicates" last, and only "Pundit predicates" has the Built-in badge

#### Scenario: Shared ontology in the selection
- **WHEN** the shared ontology is checked and the user toggles another ontology
- **THEN** the saved selection includes the shared ontology's id with its categories

### Requirement: No imported ontology
When the user has imported no ontology with elements, the list SHALL open with the line "You haven't imported any ontology yet.", followed by the built-in ontologies.

#### Scenario: Only the shared ontology
- **WHEN** the server lists only "Pundit predicates"
- **THEN** the list shows the line and then "Pundit predicates" with its badge
