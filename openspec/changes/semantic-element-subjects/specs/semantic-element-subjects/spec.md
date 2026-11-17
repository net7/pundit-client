## ADDED Requirements

### Requirement: Triple subject
A triple of a `Linking` annotation SHALL have an optional `subject`. When present it SHALL be an ontology element `{ uri, label, description?, source: 'search', elementType: 'class' | 'entity' }` or a hand-typed URI `{ uri, source: 'free-text' }`; it SHALL never be a literal. A triple without `subject` SHALL mean that the annotated fragment is its subject. The annotation's `subject` (the fragment) SHALL stay unchanged for every triple. No triple linking the fragment to an element subject SHALL be added.

#### Scenario: Element subject saved
- **WHEN** the user saves the triple `Dante Alighieri (entity) bornIn Florence` on the selected word "Dante"
- **THEN** the annotation subject is the fragment "Dante"
- **AND** its content holds `{ subject: { uri, label: 'Dante Alighieri', source: 'search', elementType: 'entity' }, predicate: { label, uri }, objectType: 'uri', object: { … } }`

#### Scenario: Relation about the selection saved
- **WHEN** the user saves a triple among the relations about the selection
- **THEN** the saved triple has no `subject` property

#### Scenario: Existing annotation
- **WHEN** an annotation saved before this change is shown or reopened
- **THEN** all its triples are treated as having the fragment as subject and it is shown as before

### Requirement: Relations about the selection unchanged, subject blocks on request
The relations about the selection SHALL be shown as before this change: same title "Semantic relations", same rows, no label and no subject shown. After the last block an "Add relations about an entity or class" button SHALL be shown. Every block whose subject is an ontology element or a URI SHALL show the line "About" followed by the subject field, then the same rows hanging from it on a vertical line; a single line SHALL separate the first block from the relations about the selection, and only space the blocks from each other. No subject block SHALL be shown until the user adds one, unless the annotation already has element subjects. One annotation SHALL be able to hold relations about the selection and any number of subject blocks.

#### Scenario: New semantic annotation
- **WHEN** the user opens the semantic section for a new annotation
- **THEN** it shows the form of today, with one empty row
- **AND** the "Add relations about an entity or class" button below, and no subject block

#### Scenario: Mixing subjects
- **WHEN** the user fills a relation about the selection and a block about `Dante Alighieri` and saves
- **THEN** the annotation holds both triples, the first without `subject`, the second with it

#### Scenario: Only element subjects
- **WHEN** the user leaves the selection row empty and saves a block about `Dante Alighieri`
- **THEN** every saved triple has `Dante Alighieri` as subject

### Requirement: Subject groups
An element block SHALL be a run of consecutive triples with the same element subject. The subject SHALL be chosen once on the subject line and SHALL apply to every triple of the block. The same element MAY be the subject of more than one block.

#### Scenario: Several triples with the same subject
- **WHEN** the user picks `Dante Alighieri` as subject of a group and adds three rows in it
- **THEN** the three saved triples have `Dante Alighieri` as subject

#### Scenario: Changing a group subject
- **WHEN** the user changes the subject of a group with two triples from `Dante Alighieri` to `Beatrice`
- **THEN** both triples are saved with `Beatrice` as subject

### Requirement: Subject field
While the user types at least 1 character in the subject field, the client SHALL search the classes and entities of the selected ontologies after a short debounce, show a loader, then one option per result with label, source label with external link and ENTITY/CLASS badge; only the answer to the latest query SHALL be shown. A typed URI (text starting with a URI scheme) SHALL be accepted as subject through a "Use “…” as URI" option, Enter, or leaving the field. Any other free text SHALL NOT be accepted: leaving the field or pressing Escape SHALL restore the previous subject. When no ontology is used for classes or entities, a hint inviting to select ontologies SHALL be shown. In the subject and object options a long source label SHALL be cut with an ellipsis, so the option label stays visible and clickable.

#### Scenario: Search a subject
- **WHEN** the user types `dan` in the subject field
- **THEN** after the loader the classes and entities matching `dan` are listed

#### Scenario: Typed URI
- **WHEN** the user types `https://example.org/vita-nova` in the subject field and presses Enter
- **THEN** the block subject is that URI, shown with the URI badge
- **AND** its triples are saved with `subject: { uri: 'https://example.org/vita-nova', source: 'free-text' }`

#### Scenario: Free text refused
- **WHEN** the user types `Dante` and leaves the field without picking an option
- **THEN** the field shows the subject selected before

#### Scenario: Long ontology name
- **WHEN** an option comes from an ontology with a long name
- **THEN** the source label is cut with an ellipsis and the option label stays visible and clickable

#### Scenario: Open subject URI
- **WHEN** the user clicks the external-link icon of a subject option
- **THEN** the URI opens in a new tab and the subject does not change

### Requirement: Adding and removing blocks
"Add relations about an entity or class" SHALL append an subject block without subject and with one empty row, and focus its subject field. Removing the last row of an subject block SHALL remove the block. The last row about the selection SHALL be cleared, not removed. No other remove action SHALL be shown on the subject line.

#### Scenario: Remove a block
- **WHEN** the user removes the last row of an subject block
- **THEN** the block is gone and the relations about the selection are unchanged

### Requirement: Saving complete blocks
Saving SHALL be possible when at least one block holds a complete triple (predicate and object, in a block with a subject). Incomplete rows and subject blocks without subject SHALL NOT be saved.

#### Scenario: subject block without subject
- **WHEN** the user fills a row of an subject block without picking its subject
- **THEN** Save stays disabled if no other triple is complete, and that row is not saved

#### Scenario: One complete block
- **WHEN** a relation about the selection is complete and an subject block is empty
- **THEN** Save is enabled and only the relation about the selection is saved

### Requirement: Stored order
The triples SHALL be saved with the relations about the selection first, then the groups in display order, row after row. Reopening SHALL build the groups from the stored order of the triples with a subject, without reordering them: non-consecutive triples with the same subject SHALL be shown in separate groups.

#### Scenario: Interleaved subjects
- **WHEN** the user reopens an annotation whose triples with a subject have subjects `S1, S1, S2, S1`
- **THEN** three groups are shown: `S1` (2 rows), `S2` (1 row), `S1` (1 row)
- **AND** saving without edits stores those triples in the same order

### Requirement: Rows inside a group
Rows SHALL keep their current behaviour in both parts: predicate autocomplete, object as ontology element, literal or free-text URI, date rows read-only. A row the user did not edit SHALL be saved exactly as stored when its group keeps the subject it was loaded with; when the group subject changed, it SHALL be saved as stored with only its subject replaced.

#### Scenario: Unedited row
- **WHEN** the user reopens an annotation and saves it without edits
- **THEN** every triple is saved exactly as stored, `subject` included

#### Scenario: Read-only date row moved to another subject
- **WHEN** the user changes the subject of a group holding a date triple
- **THEN** the date triple is saved unchanged except for its new subject

### Requirement: Card display
The annotation card SHALL show the triples in the same subject groups. The triples with a subject SHALL be shown in one block per subject, headed "About ‹label›" and set apart from the object above it, the label linking to its URI (new tab), the URI shown as its tooltip, with no type badge, the triples hanging from it on a vertical line. Triples without subject SHALL have no header.

In every triple of the card the predicate label SHALL link to the predicate URI (new tab), the URI shown as its tooltip; a predicate without URI SHALL be shown as plain text.

Long texts SHALL stay inside the card: the subject label and the predicate label are cut with an ellipsis (full text in the tooltip), long URIs and literals wrap.

#### Scenario: Predicate link
- **WHEN** the user clicks the predicate `born in` of a triple in the card
- **THEN** its URI opens in a new tab

#### Scenario: Annotation with relations about the selection only
- **WHEN** the card shows an annotation whose triples have no `subject`
- **THEN** it looks as today

#### Scenario: Annotation with element subjects
- **WHEN** the card shows an annotation with a relation about the selection and a `Dante Alighieri` group
- **THEN** the first triple has no header and the `Dante Alighieri` group has a header without type badge

#### Scenario: Long texts
- **WHEN** a triple in the card has a long subject label, predicate label or object URI
- **THEN** nothing overflows the card: the labels are cut with an ellipsis and the URI wraps
