## ADDED Requirements

### Requirement: Ontologies action in the sidebar header
The sidebar header SHALL show, to logged users only, an Ontologies action with the `ontologies` (graph) icon, placed after the notebook-panel action and before the close button. Clicking it SHALL toggle the Ontologies panel. The Ontologies panel and the notebook panel SHALL never be open at the same time.

#### Scenario: Anonymous user
- **WHEN** no user is logged in
- **THEN** the Ontologies action is not rendered

#### Scenario: Toggle the panel
- **WHEN** a logged user clicks the Ontologies action
- **THEN** the Ontologies panel opens and the action is marked active
- **AND** a second click closes it

#### Scenario: Panels are mutually exclusive
- **WHEN** the notebook panel is open and the user clicks the Ontologies action
- **THEN** the notebook panel closes and the Ontologies panel opens
- **AND** the reverse holds when the Ontologies panel is open and the user clicks the notebook-panel action

### Requirement: List of the user's ontologies
The Ontologies panel SHALL show a title, a short description, and one row per ready ontology of the logged user, in the order returned by the server. Each row SHALL show a checkbox reflecting whether the ontology is selected, the ontology name with its prefix beside it when it has one, and, under them, one checkbox per element category (ENTITY, CLASS, PREDICATE) with its number of elements; a category with zero elements is shown unchecked and cannot be checked. An ontology with zero elements in every category SHALL NOT be listed. The list SHALL be loaded after login, together with the user's other data, and cleared on logout.

#### Scenario: Ontologies loaded at login
- **WHEN** the user logs in (or the page loads with a valid session)
- **THEN** the client requests the user's ontologies once, after notebooks, annotations, tags and predicates
- **AND** the panel shows them when opened

#### Scenario: Categories from counts
- **WHEN** an ontology has 12 classes, 0 entities and 40 predicates
- **THEN** its row shows ENTITY 0 (unchecked, disabled), CLASS 12 and PREDICATE 40

#### Scenario: Ontology without elements
- **WHEN** an ontology has no element in any category
- **THEN** it is not listed in the panel

#### Scenario: No ontologies
- **WHEN** the user has no ready ontology
- **THEN** the panel shows an empty-state message with a link to the ontologies page of the Pundit dashboard, opening in a new tab

#### Scenario: Loading the list fails
- **WHEN** the ontology list request fails
- **THEN** the login chain still completes (annotations are shown, the user stays logged)
- **AND** the panel shows an error message instead of the list
- **AND** the semantic section behaves as if no ontology were selected

#### Scenario: Logout
- **WHEN** the user logs out
- **THEN** the ontology list and selection are cleared and the panel is closed

### Requirement: Selection persisted per user
Toggling a row's checkbox SHALL update the selection in the panel immediately, show a loader in place of that row's checkbox and disable that row's controls until the save answers, and save the full selection (each selected ontology with its categories) to the server for the logged user. Consecutive changes within a short interval SHALL be saved with a single request carrying the final selection; a search started while a save is pending SHALL wait for that save. If saving fails, the panel SHALL restore the last saved selection and show an error toast.

#### Scenario: Select an ontology
- **WHEN** the user checks an unselected ontology
- **THEN** its checkbox is checked at once
- **AND** a save request with the new selection is sent
- **AND** subsequent searches in the semantic section include that ontology

#### Scenario: Rapid toggles
- **WHEN** the user checks three ontologies in quick succession
- **THEN** a single save request is sent with all three ontologies added

#### Scenario: Save fails
- **WHEN** the save request fails
- **THEN** the checkboxes return to the last saved selection
- **AND** an error toast is shown

#### Scenario: Same selection everywhere
- **WHEN** the user opens Pundit on another page, device, or in the Chrome extension
- **THEN** the panel shows the selection saved by the server

### Requirement: Categories per ontology
Each category checkbox of a row SHALL say whether that category of that ontology is used in the annotator. Checking an ontology SHALL use all the categories it has elements of; unchecking it SHALL stop using all of them. Checking a category of an unselected ontology SHALL select the ontology with that category only; unchecking its last checked category SHALL deselect it. The selection saved to the server SHALL carry, for each selected ontology, its active categories, and searches SHALL only return elements of the categories active for their ontology.

#### Scenario: Only the predicates of FOAF
- **WHEN** the user checks FOAF (predicates and classes) and unchecks its CLASS category
- **THEN** FOAF stays checked with only PREDICATE checked
- **AND** the saved selection contains FOAF with the categories `["predicate"]`
- **AND** the object autocomplete never proposes FOAF classes, while the predicate search proposes FOAF predicates

#### Scenario: Check one category of an unselected ontology
- **WHEN** the user checks the ENTITY category of an unchecked ontology
- **THEN** the ontology becomes checked with only ENTITY active

#### Scenario: Last category off
- **WHEN** the user unchecks the only checked category of an ontology
- **THEN** the ontology becomes unchecked

#### Scenario: No search for unused categories
- **WHEN** no selected ontology has CLASS or ENTITY active
- **THEN** typing in the object input sends no search and the input behaves as free text

#### Scenario: Loader while saving
- **WHEN** the user changes the selection of an ontology
- **THEN** a loader replaces that row's checkbox and its category checkboxes are disabled until the save answers
- **AND** the other rows stay usable
