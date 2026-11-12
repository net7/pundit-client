## ADDED Requirements

### Requirement: Range from the target offsets
For each annotation of the response, the client SHALL take the start node from `target.segment` and the end node from `target.end_segment`, or from `target.segment` when `end_segment` is null, through the id → text node map of the request. When `target.start` and `target.end` are both numbers, the client SHALL build the DOM Range with `range.setStart(startNode, start)` and `range.setEnd(endNode, end)`, using the offsets as received (UTF-16 code units, no conversion). An annotation whose segment ids are not in the map, or whose nodes are no longer in the document, SHALL be skipped.

#### Scenario: Annotation inside one segment
- **WHEN** segment `c1` is "Her name is Portia, nothing undervalued" and the target is `{ segment: "c1", end_segment: null, exact: "Portia", start: 12, end: 18 }`
- **THEN** the preview's range starts at offset 12 and ends at offset 18 of the `c1` node, and its text is "Portia"

#### Scenario: Annotation across segments through a whitespace-only segment
- **WHEN** the segments are `c1` "Her name is Portia, nothing undervalued", `c2` "\n      ", `c3` "To Cato's daughter, Brutus' Portia:" and the target is `{ segment: "c1", end_segment: "c3", exact: "nothing undervalued\n      To Cato's daughter", start: 20, end: 18 }`
- **THEN** the preview's range goes from offset 20 of `c1` to offset 18 of `c3`, and its text equals `exact`

#### Scenario: Emoji before the passage
- **WHEN** segment `c1` is "👋 Her name is Portia" and the target has `exact` "Portia", `start` 15, `end` 21
- **THEN** the range is built with offsets 15 and 21 as received and its text is "Portia"

#### Scenario: Unknown segment
- **WHEN** `target.segment` or `target.end_segment` is not an id of the request
- **THEN** the annotation is skipped and the other annotations are still placed

### Requirement: Quote anchoring when offsets are missing or do not match
The client SHALL anchor the annotation with `target.exact`, `target.prefix` and `target.suffix` when `start` or `end` is null, or when the text of the Range built from the offsets is not exactly `target.exact` (including offsets out of the node's bounds). Quote anchoring SHALL look for the occurrences of `exact` in the text of the segments from `segment` to `end_segment` (or `segment` alone), joined in order, and keep the occurrence that best matches the context: `prefix` matching the text right before it and `suffix` the text right after it, read on the selection's text; on equal match, the first occurrence. When `exact` is not found, the annotation SHALL be skipped. The resulting Range SHALL be checked again against `exact` before the payload is built.

#### Scenario: Null offsets, prefix picks the second occurrence
- **WHEN** segment `c1` is "Portia met Portia at Belmont" and the target is `{ segment: "c1", exact: "Portia", prefix: "met ", suffix: " at", start: null, end: null }`
- **THEN** the preview's range covers the second "Portia" (offsets 11–17)

#### Scenario: Null offsets, no context
- **WHEN** offsets are null and neither `prefix` nor `suffix` tells the occurrences apart
- **THEN** the first occurrence is used

#### Scenario: Offsets do not match exact, quote fallback
- **WHEN** the Range built from `start`/`end` has a text different from `exact` (the page changed after the request) and `exact` is still in the segment
- **THEN** the range is placed on `exact` by quote anchoring

#### Scenario: Offsets and quote both fail
- **WHEN** the Range text differs from `exact` and `exact` is not found in the segments
- **THEN** the annotation is skipped and no payload is built for it

### Requirement: Payload of each annotation type
Every placed annotation SHALL produce one preview payload, cloned from the pending annotation payload with `subject.selected` serialized from the Range, as today; previews SHALL follow the order of the response. The annotation's `type` SHALL decide the payload; a missing or unknown `type` SHALL fall back to the requested annotation type. The saved payload shape SHALL be unchanged:
- `highlight`: type `Highlighting`, no content, no tags;
- `comment`: type `Commenting`, content `{ comment }` with the comment as received (already HTML-escaped by the server, not escaped again); skipped when the comment is missing or empty;
- `tags`: type `Highlighting` with the tags as received (already normalized by the server); skipped when there is no tag;
- `semantic_annotation`: type `Linking`, content from `triples`, the list of all the triples whose subject is the annotation's passage: one payload per place of the text, with one content item per triple, in the order of `triples`. When the object is an ontology element (it has a `uri`): `{ predicate: { label, uri }, objectType: 'uri', object: { uri, label, description?, source: 'search', elementType } }`, `description` only when present. When the object is a literal value (`{ text }`, e.g. a date as `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, a number, a measure): `{ predicate: { label, uri }, objectType: 'literal', object: { text } }` with the text trimmed. A triple whose predicate has no `uri`, or whose object has neither a `uri` nor a non-empty text, is left out and the other triples are kept; the annotation is skipped when no triple is left.

No predicate URI SHALL be derived from a label: the client SHALL use the URIs of the response.

#### Scenario: Semantic triple from ontology elements
- **WHEN** the annotation is `semantic_annotation` whose only triple has `predicate` `{ uri: "http://www.w3.org/2000/01/rdf-schema#isDefinedBy", label: "identifies" }` and `object` `{ uri: "http://example.org/shakespeare#Portia", label: "Portia", description: "Heiress of Belmont", elementType: "entity" }`
- **THEN** the payload type is `Linking` and its content is `[{ predicate: { label: "identifies", uri: "http://www.w3.org/2000/01/rdf-schema#isDefinedBy" }, objectType: "uri", object: { uri: "http://example.org/shakespeare#Portia", label: "Portia", description: "Heiress of Belmont", source: "search", elementType: "entity" } }]`

#### Scenario: Object without description
- **WHEN** a triple's `object` has no `description`
- **THEN** the content's object has no `description` key

#### Scenario: Semantic triple with a literal object
- **WHEN** the annotation is `semantic_annotation` whose only triple has `predicate` `{ uri: "http://purl.org/dc/terms/date", label: "represents the date" }` and `object` `{ text: "1776-07-04" }`
- **THEN** the payload type is `Linking` and its content is `[{ predicate: { label: "represents the date", uri: "http://purl.org/dc/terms/date" }, objectType: "literal", object: { text: "1776-07-04" } }]`

#### Scenario: Several triples on one place
- **WHEN** the annotation is `semantic_annotation` on "Portia" whose `triples` are, in this order, `identifies` → `{ uri: "http://example.org/shakespeare#Portia", label: "Portia", elementType: "entity" }` and `lives in` (`http://example.org/shakespeare#livesIn`) → `{ uri: "http://example.org/shakespeare#Belmont", label: "Belmont", elementType: "entity" }`
- **THEN** one payload of type `Linking` is built on "Portia" and its content holds two triples, the `identifies` one first and the `lives in` one second

#### Scenario: Comment
- **WHEN** the annotation is `comment` with `comment` "Bassanio &amp; Porzia"
- **THEN** the payload type is `Commenting` and its content is `{ comment: "Bassanio &amp; Porzia" }`

#### Scenario: Tags
- **WHEN** the annotation is `tags` with `tags` `["people", "heiress"]`
- **THEN** the payload type is `Highlighting` and its tags are `["people", "heiress"]`

#### Scenario: Incomplete semantic triple among complete ones
- **WHEN** a `semantic_annotation` has in `triples` a triple whose predicate has no `uri`, or whose object has neither a `uri` nor a non-empty (after trim) `text`, next to complete triples
- **THEN** that triple is left out and the payload content holds the complete triples, in their order

#### Scenario: No complete semantic triple
- **WHEN** a `semantic_annotation` has no `triples`, an empty `triples`, or only incomplete triples
- **THEN** the annotation is skipped
