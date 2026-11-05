## ADDED Requirements

### Requirement: Predicate autocomplete
The predicate of each semantic row SHALL be an autocomplete field over the predicates of the selected ontologies only, with the look of the current dropdown (selected label, chevron); Pundit's built-in predicates SHALL NOT be offered. A new row SHALL start without a predicate, and a row without a predicate SHALL NOT be saved. The predicate SHALL be picked from the results: free text SHALL NOT be accepted. While the user types (at least 1 character), the client SHALL search the predicates of the ontologies used for predicates after a short debounce and show a loader, then the results (label, source label — the ontology prefix when present, otherwise its name — and an external-link icon that opens the URI in a new tab without picking the option), or a "no predicate found" message. With an empty field the list SHALL show a hint to type; nothing is searched before the user types.

#### Scenario: New row
- **WHEN** the user opens the semantic section for a new annotation
- **THEN** the predicate field is empty and the triple is not saved until a predicate is picked

#### Scenario: Search ontology predicates
- **WHEN** the user types at least 1 character in the predicate field
- **THEN** after a short debounce the client searches the predicates of the selected ontologies, showing a loader
- **AND** the list shows only the ontology results, each with its source label

#### Scenario: No free text
- **WHEN** the user types in the predicate field and then presses Escape or leaves the field without picking an option
- **THEN** the field shows the predicate selected before (or stays empty) and the triple is unchanged

#### Scenario: Open the predicate URI
- **WHEN** the user clicks the external-link icon of an option
- **THEN** the URI opens in a new tab
- **AND** the selected predicate does not change

#### Scenario: Reopen a triple with a former built-in predicate
- **WHEN** the user edits an annotation whose triple uses one of Pundit's former built-in predicates
- **THEN** the row shows that predicate as selected and saving it unchanged keeps it

### Requirement: Warning when no ontology gives predicates
When the edit modal opens with the semantic section and the ontology list is loaded, the client SHALL show a warning toast that stays open until closed: if the user has no ontology with elements, inviting to import ontologies with a button that opens the ontologies page of the dashboard in a new tab; otherwise, if no ontology is used for predicates, inviting to select one with a button that opens the Ontologies panel of the sidebar. No toast SHALL be shown when some ontology is used for predicates, or when the list is not loaded.

#### Scenario: No ontologies
- **WHEN** a user without ontologies opens a semantic annotation
- **THEN** a warning toast with an "Import an ontology" button is shown, and the button opens the ontologies page

#### Scenario: No predicates selected
- **WHEN** a user with ontologies, none used for predicates, opens a semantic annotation
- **THEN** a warning toast with a "Select ontologies" button is shown, and the button expands the sidebar and opens the Ontologies panel

### Requirement: Object autocomplete
The object input SHALL keep accepting free text. When at least 1 character is typed and at least one ontology is used for classes or entities, the client SHALL search the classes and entities of the selected ontologies after a short debounce and show a dropdown under the input: a loader while the request is pending, then one option per result (label, source label with external link, ENTITY or CLASS badge), and a last option "Use "<text>" as <type>" that keeps the typed text. Only the answer to the latest query SHALL be shown. The type indicator in the input SHALL read LITERAL or URI for free text (as today) and ENTITY or CLASS when the object comes from the autocomplete.

#### Scenario: Results shown
- **WHEN** the user types `pers` in the object input and one ontology is selected
- **THEN** a loader is shown, then the classes and entities matching `pers`, each with its badge
- **AND** the last option offers to use `pers` as a literal

#### Scenario: Stale answers discarded
- **WHEN** the user types `pe`, then `per`, then `pers` and the answers arrive out of order
- **THEN** only the results for `pers` are shown

#### Scenario: Pick a result
- **WHEN** the user picks the class `Person` from the dropdown
- **THEN** the input shows `Person` with the CLASS badge and the dropdown closes

#### Scenario: Keep free text
- **WHEN** the user picks the "Use … as …" option, presses Escape, or leaves the input without picking a result
- **THEN** the typed text is kept as a literal, or as a URI when it starts with a URI scheme, exactly as today

#### Scenario: Editing a picked object
- **WHEN** the user edits the text of an object picked from the autocomplete
- **THEN** the object becomes free text again (LITERAL or URI) until another result is picked

#### Scenario: No ontology selected
- **WHEN** no ontology is selected
- **THEN** no search is sent and the input behaves exactly as today

#### Scenario: Search fails or finds nothing
- **WHEN** the search request fails or returns no result
- **THEN** the dropdown shows only the "Use … as …" option and no error toast is shown

### Requirement: Saving and reopening ontology terms
An object picked from the autocomplete SHALL be saved as `objectType: 'uri'` with `object: { uri, label, source: 'search', elementType }`, where `elementType` is `'class'` or `'entity'`. No identifier of the source ontology or element SHALL be saved. Free-text objects SHALL be saved as today (`literal` with `text`, or `uri` with `source: 'free-text'`). When an annotation is reopened for editing, triples with a `search` URI object SHALL be editable and show their label with the badge given by `elementType`, or URI when `elementType` is absent; date triples SHALL stay read-only.

#### Scenario: Save a picked class
- **WHEN** the user saves a triple whose object is the class `Person` (`https://example.org/onto#Person`)
- **THEN** the annotation content contains `{ predicate, objectType: 'uri', object: { uri: 'https://example.org/onto#Person', label: 'Person', source: 'search', elementType: 'class' } }`
- **AND** the object contains no ontology id

#### Scenario: Reopen a saved entity
- **WHEN** the user edits an annotation with a `search` URI object whose `elementType` is `entity`
- **THEN** the row is editable and shows the label with the ENTITY badge

#### Scenario: Reopen a legacy URI triple
- **WHEN** the user edits an annotation with a `search` URI object without `elementType` but with `rdfTypes`
- **THEN** the row is editable, shows the label and the first `rdfTypes` label as today
- **AND** saving it without changes keeps its `rdfTypes`

#### Scenario: Unedited triples are saved unchanged
- **WHEN** the user reopens a semantic annotation and saves it without editing a row (whether or not other rows or sections changed)
- **THEN** that row is saved exactly as its stored triple (same `objectType`, `object` fields, `source`, `rdfTypes`, `elementType`)

#### Scenario: Reopen an ontology predicate
- **WHEN** the user edits an annotation whose triple uses a predicate that is not a basic predicate
- **THEN** the row shows that predicate as selected
- **AND** editing only the object saves the triple with the same predicate `label` and `uri`

#### Scenario: Replace a picked object with free text
- **WHEN** the user reopens a triple with a picked entity and replaces the object with typed text
- **THEN** the triple is saved as a literal (or free-text URI) with no `elementType`
