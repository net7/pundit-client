## MODIFIED Requirements

### Requirement: The AI request carries exactly the selection
The segments of an AI annotation request SHALL hold exactly the text the user selected: one segment per text node inside the selection, in reading order, the nodes at its boundaries cut at the selection's start and end. Text nodes made only of whitespace or line breaks SHALL be sent as segments; only empty text nodes (`""`) SHALL be skipped. Segment texts SHALL be sent as they are, without trimming, so that the segments joined in order are exactly the selection's text. Text outside the selection SHALL NOT be sent. Every segment, whitespace-only ones included, SHALL be kept in the id → text node map used to place the response. The request SHALL NOT carry `selected_text`.

#### Scenario: Selection starting inside formatted text
- **WHEN** the page has `<p>Comune di <em>Viterbo</em> si trova vicino al lago</p>` and the user selects "si trova vicino"
- **THEN** the request has one segment "si trova vicino" (not "Comune di")

#### Scenario: Selection across formatting
- **WHEN** the user selects "di Viterbo si trova" in the same paragraph
- **THEN** the segments are "di ", "Viterbo", " si trova", in order, with their leading and trailing spaces

#### Scenario: Selection across paragraphs
- **WHEN** the user selects from the middle of one paragraph to the middle of the next
- **THEN** the segments are the end of the first paragraph, the whitespace-only text node between the paragraphs (e.g. `"\n  "`), and the beginning of the second
- **AND** the segments joined in order equal the selection's text

#### Scenario: Whitespace-only node in the map
- **WHEN** a segment is made only of whitespace
- **THEN** its id maps to its text node, like every other segment

#### Scenario: No selected_text
- **WHEN** the request is built
- **THEN** its body has `segments`, `prompt` and `annotation_type` only
