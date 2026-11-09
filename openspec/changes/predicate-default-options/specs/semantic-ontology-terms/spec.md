## MODIFIED Requirements

### Requirement: Predicate autocomplete
The predicate of each semantic row SHALL be an autocomplete field over the predicates of the selected ontologies only, with the look of the current dropdown (selected label, chevron); Pundit's built-in predicates SHALL NOT be offered. A new row SHALL start without a predicate, and a row without a predicate SHALL NOT be saved. The predicate SHALL be picked from the results: free text SHALL NOT be accepted. While the user types (at least 1 character), the client SHALL search the predicates of the ontologies used for predicates after a short debounce and show a loader, then the results (label, source label — the ontology prefix when present, otherwise its name — and an external-link icon that opens the URI in a new tab without picking the option), or a "no predicate found" message. With an empty field, when some ontology is used for predicates, the list SHALL show the first 10 predicates of those ontologies ordered by label, with the same option layout; when those ontologies hold more predicates than shown, a footer SHALL read "Type to search among N predicates", N being the total predicates of the ontologies used for predicates. The first predicates SHALL be requested once and shared by all rows, and requested again only after the ontology selection changes. When nothing is used for predicates, or the request fails or returns no result, the empty field SHALL show the hint to type instead.

#### Scenario: New row
- **WHEN** the user opens the semantic section for a new annotation
- **THEN** the predicate field is empty and the triple is not saved until a predicate is picked

#### Scenario: First predicates on focus
- **WHEN** the user focuses an empty predicate field (or opens it with the chevron) and some ontology is used for predicates
- **THEN** the list shows a loader the first time, then the first 10 predicates ordered by label, each with its source label
- **AND** picking one selects it as a searched option would

#### Scenario: Total footer
- **WHEN** the first predicates are shown and the ontologies used for predicates hold more predicates than shown
- **THEN** a footer reads "Type to search among N predicates"
- **AND** no footer is shown when every predicate is already listed

#### Scenario: First predicates reused
- **WHEN** the user opens the predicate field of another row, or the same row again, without changing the ontology selection
- **THEN** the first predicates are shown without a new request

#### Scenario: Selection changed
- **WHEN** the ontology selection changes and the user opens an empty predicate field
- **THEN** the first predicates are requested again

#### Scenario: Clearing the text
- **WHEN** the user deletes all the text typed in the predicate field
- **THEN** the list shows the first predicates again, not the hint

#### Scenario: First predicates not available
- **WHEN** no ontology is used for predicates, or the request for the first predicates fails or returns nothing
- **THEN** the empty field shows the hint to type, as before

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
