# ai-annotation-element-subjects Specification

## Purpose

Define how AI-proposed semantic triples whose subject is an element of the user's ontologies (class or entity) are received, saved in the same shape as hand-written element subjects, kept in order, and previewed, saved and reopened like annotations written in the edit modal, including overlapping AI annotations.

## Requirements
### Requirement: AI triples may carry an element subject
An AI triple of a `semantic_annotation` SHALL accept an optional `subject` with the shape of an element object: `{ uri, label, description?, elementType: 'class' | 'entity' }`. When `subject` is absent, the subject of the triple SHALL be the passage of the annotation `target`, as today. The subject SHALL never be a literal or a hand-typed URI and carries no `source`.

#### Scenario: Response with a subject
- **WHEN** a `semantic_annotation` triple is `{ subject: { uri: "http://example.org/shakespeare#Portia", label: "Portia", description: "Heiress of Belmont", elementType: "entity" }, predicate: { uri: "http://example.org/shakespeare#livesIn", label: "lives in" }, object: { uri: "http://example.org/shakespeare#Belmont", label: "Belmont", elementType: "entity" } }`
- **THEN** the response is accepted and the triple is placed with its annotation

#### Scenario: Response without subject
- **WHEN** a `semantic_annotation` triple has no `subject`
- **THEN** it is a triple about the passage, built as today

### Requirement: Saved shape of an AI triple with an element subject
A triple whose `subject` has a non-empty `uri` SHALL be saved with `subjectType: 'uri'` and `subject: { uri, label, description?, source: 'search', elementType }`, the shape of a subject picked from the element search in the edit modal; `description` SHALL be present only when received. Predicate and object SHALL be built as for a triple without subject. A triple without `subject`, or whose `subject` has no `uri` (missing, empty, not an object), SHALL be saved as a triple about the fragment, without `subject` and `subjectType`, and SHALL NOT be dropped because of its subject. The other rules for incomplete triples (no predicate URI, object with neither URI nor text) SHALL be unchanged.

#### Scenario: Triple with element subject
- **WHEN** the triple of "Response with a subject" is converted
- **THEN** the content item is `{ subjectType: "uri", subject: { uri: "http://example.org/shakespeare#Portia", label: "Portia", description: "Heiress of Belmont", source: "search", elementType: "entity" }, predicate: { label: "lives in", uri: "http://example.org/shakespeare#livesIn" }, objectType: "uri", object: { uri: "http://example.org/shakespeare#Belmont", label: "Belmont", source: "search", elementType: "entity" } }`

#### Scenario: Subject without description
- **WHEN** the triple's `subject` has no `description`
- **THEN** the saved subject has no `description` key

#### Scenario: Subject with a literal object
- **WHEN** a triple has an element subject and the object `{ text: "1596" }`
- **THEN** the content item has `subjectType: "uri"`, the element subject, `objectType: "literal"` and `object: { text: "1596" }`

#### Scenario: Subject without uri
- **WHEN** a triple has `subject: { uri: "", label: "Portia", elementType: "entity" }` and a complete predicate and object
- **THEN** the content item is the triple about the fragment, with no `subject` and no `subjectType`

#### Scenario: Triple without subject
- **WHEN** a triple has no `subject`
- **THEN** the content item is exactly the one built today: `{ predicate, objectType, object }`, with no `subject` and no `subjectType`

#### Scenario: Incomplete triple with a subject
- **WHEN** a triple has an element subject but its predicate has no `uri`
- **THEN** it is left out, like any incomplete triple

### Requirement: AI triple order is kept
The content of an AI semantic annotation SHALL hold its triples in the order received, without sorting or regrouping: triples about the passage first, then the element-subject triples grouped by subject in the order the subjects appear, as sent. Leaving out an incomplete triple SHALL NOT reorder the others.

#### Scenario: Mixed annotation
- **WHEN** the triples are, in order, `identifies → Portia` (no subject), `Portia · lives in → Belmont`, `Portia · loves → Bassanio`, `Bassanio · friend of → Antonio`
- **THEN** the content holds the four triples in the same order: the fragment triple, the two triples about Portia, then the one about Bassanio

### Requirement: AI annotations with element subjects read like hand-written ones
An AI semantic annotation with element-subject triples SHALL be previewed, saved and reopened exactly like an annotation saved from the edit modal: the preview card and the saved card SHALL show the triples about the passage without header and each run of triples with the same element subject under "About ‹subject›"; "Save all" SHALL save the subjects as built; editing the saved annotation SHALL open the semantic section with the relations about the selection first and one subject block per run, and saving it unedited SHALL keep every subject.

#### Scenario: Preview of a mixed annotation
- **WHEN** the AI proposes the mixed annotation of "Mixed annotation"
- **THEN** its preview payload is `Linking` with the four triples and their subjects, and the card shows the fragment triple, then "About Portia" with two triples, then "About Bassanio" with one

#### Scenario: Save all keeps subjects
- **WHEN** the user clicks "Save all" with that preview
- **THEN** the saved payload holds the four triples with `subjectType` and `subject` as built

#### Scenario: Reopening the saved annotation
- **WHEN** the user edits the saved annotation's semantic relations and saves without changes
- **THEN** the edit modal shows the fragment triple among the relations about the selection, then the "About Portia" and "About Bassanio" blocks, and the saved content equals the stored one

### Requirement: Overlapping AI annotations are each placed and opened
AI annotations of the same response whose passages overlap (e.g. a sentence and a word inside it) SHALL each produce their own preview: each SHALL be highlighted on its passage and its card SHALL be reachable from its highlight; the same element-subject triple in several annotations SHALL be kept in each of them.

#### Scenario: Sentence and word inside it
- **WHEN** the response holds a `semantic_annotation` on "Her name is Portia, nothing else" and one on "Portia"
- **THEN** two previews are drawn, the "Portia" highlight nested in the sentence one, and each card opens from its highlight

#### Scenario: Same triple in two annotations
- **WHEN** `Portia · lives in → Belmont` is in both annotations
- **THEN** both payloads hold it

