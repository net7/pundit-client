## ADDED Requirements

### Requirement: The AI request carries exactly the selection
The chunks of an AI annotation request SHALL hold exactly the text the user selected: one chunk per non-empty text node inside the selection, the nodes at its boundaries cut at the selection's start and end. Text outside the selection SHALL NOT be sent. `selected_text` SHALL be the selection's text.

#### Scenario: Selection starting inside formatted text
- **WHEN** the page has `<p>Comune di <em>Viterbo</em> si trova vicino al lago</p>` and the user selects "si trova vicino"
- **THEN** the request has one chunk "si trova vicino" (not "Comune di")

#### Scenario: Selection across formatting
- **WHEN** the user selects "di Viterbo si trova" in the same paragraph
- **THEN** the chunks are "di ", "Viterbo", " si trova", in order

#### Scenario: Selection across paragraphs
- **WHEN** the user selects from the middle of one paragraph to the middle of the next
- **THEN** the chunks are the end of the first paragraph and the beginning of the second only

### Requirement: The selection is restored as the highlight is
The selection SHALL be restored from the pending annotation's selectors with the same anchoring used to highlight annotations, falling back from the range selector to the text position and the text quote when one does not match the stored quote. When it cannot be restored, no request SHALL be sent.

#### Scenario: Restored like the highlight
- **WHEN** the pending annotation's range selector points inside an element with inline formatting
- **THEN** the restored selection has the same text as the stored quote

#### Scenario: Selection not found
- **WHEN** none of the selectors can be anchored in the page
- **THEN** no AI request is sent and the "no results" toast shows
