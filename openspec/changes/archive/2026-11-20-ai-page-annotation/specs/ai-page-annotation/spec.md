## ADDED Requirements

### Requirement: AI annotation of the whole page
The "Add Page Annotation" dropdown SHALL offer an "AI annotation" entry besides tag, comment and semantic. It SHALL open the AI modal on the page, titled with the page title (the page URL when there is none), offering the annotation types comment, tag and semantic, with comment selected. Highlight SHALL NOT be offered for a page. Without an active AI key the modal SHALL NOT open and the same warning as for a selection SHALL be shown, with its link to the AI settings.

#### Scenario: Opening the AI modal on the page
- **WHEN** a logged user with an active AI key picks "AI annotation" from "Add Page Annotation"
- **THEN** the AI modal opens with the page title, the instructions field and the types Comment, Tag and Semantic, with Comment selected

#### Scenario: No active AI key
- **WHEN** the user has no active AI key and picks "AI annotation" from "Add Page Annotation"
- **THEN** the modal does not open and the warning toast points to the AI settings

#### Scenario: The selection modal is unchanged
- **WHEN** the AI modal is opened from the tooltip of a selection
- **THEN** it offers Comment, Highlight, Tag and Semantic, with Highlight selected

### Requirement: The AI request on the page
An AI annotate request on the page SHALL carry `subject: "page"`, `prompt`, `annotation_type` and `context`, and SHALL NOT carry `segments`. Its `context` SHALL hold the page metadata `title`, `site` and `description`, read as for a selection, and `text`, the beginning of the page text; it SHALL NOT hold `before` or `after`. A field that would be empty SHALL be left out. When `title`, `description` and `text` are all empty no request SHALL be sent and the "no results" message SHALL be shown.

#### Scenario: Request on the page
- **WHEN** the user asks for a comment on the page titled "The Merchant of Venice", whose text starts with "In sooth, I know not why I am so sad"
- **THEN** the request is `{ subject: "page", prompt, annotation_type: "comment", context: { title: "The Merchant of Venice", site, text: "In sooth, I know not why I am so sad…" } }`, with no `segments` key

#### Scenario: Page without text in the DOM
- **WHEN** the page has a title and no text nodes (e.g. a PDF drawn on canvas)
- **THEN** the request is sent with the metadata and no `text`

#### Scenario: Nothing to send
- **WHEN** the page has no title, no description and no text
- **THEN** no request is sent and the "no results" toast shows

### Requirement: Text of the page
`text` SHALL be the text of the page's text nodes in document order from the first one, up to 6,000 characters, without looking at the page structure. Text inside `script`, `style`, `noscript`, `template` and Pundit's interface (`pnd-root`) SHALL be skipped; existing highlights SHALL be read as page text. Whitespace runs SHALL be collapsed to one space; nodes SHALL be joined as they are, without adding spaces. When the limit falls inside a word, the cut SHALL move back to the nearest space, or cut at the character when there is none. The result SHALL be trimmed.

#### Scenario: Short page
- **WHEN** the page text is 800 characters
- **THEN** `text` is the whole text, trimmed, with whitespace runs collapsed

#### Scenario: Limit without split words
- **WHEN** the page text is 20,000 characters of words separated by spaces
- **THEN** `text` is at most 6,000 characters, starts with the first word of the page and ends with a whole word

#### Scenario: Long word at the limit
- **WHEN** the page text is one 8,000-character word
- **THEN** `text` is its first 6,000 characters

#### Scenario: Skipped content
- **WHEN** the body starts with a `<script>`, a `<style>` and the `pnd-root` element, followed by a paragraph
- **THEN** `text` starts with the paragraph's text and holds none of theirs

#### Scenario: Words split by formatting
- **WHEN** the page has `lake <b>Bol</b>sena`
- **THEN** `text` reads "lake Bolsena"

### Requirement: Page proposals become page annotations
An annotation of the response with `target: null` SHALL become a page annotation: the pending page annotation with the content of the proposal, and no selection. Its type and content SHALL be set as for a selection: a comment, a list of tags, or semantic triples. A triple without `subject` SHALL be saved as a triple about the annotated page, with no `subjectType`; a triple with an element subject SHALL be saved as today. A proposal that lacks the content of its type, or that carries a target, SHALL be skipped. Every proposal left SHALL become its own annotation, in the order received. A response with no usable proposal SHALL show the "no results" message.

#### Scenario: One comment
- **WHEN** the response is `[{ type: "comment", target: null, comment: "A comedy about a bond." }]`
- **THEN** one preview is built: a `Commenting` page annotation with that comment and no `selected`

#### Scenario: Several proposals
- **WHEN** the user asks for one group of tags for the places and one for the people, and the response has two `tags` annotations with `target: null`
- **THEN** two previews are built, in that order, each a page annotation with its own tags

#### Scenario: Semantic proposal
- **WHEN** the response has a `semantic_annotation` with `target: null` and two triples, one without `subject` and one with the element subject "Portia"
- **THEN** the preview is a `Linking` page annotation whose first triple has no `subjectType` and whose second has `subjectType: "uri"` and the subject "Portia"

#### Scenario: Proposal without content
- **WHEN** the response has a `comment` annotation with `target: null` and an empty comment
- **THEN** it is skipped; if no other proposal is left the "no results" toast shows

### Requirement: Previews and saving of page proposals
The previews of page proposals SHALL be shown as cards in the page annotations list, and no highlight SHALL be drawn in the page. A preview SHALL be discardable on its own. "Save all" SHALL save every preview left as a page annotation in the selected notebook, and SHALL be disabled when none is left. Closing the modal SHALL remove the previews.

#### Scenario: Previews in the page annotations list
- **WHEN** two page proposals are received
- **THEN** two preview cards appear in the page annotations list, the page shows no new highlight and "Save all" is enabled

#### Scenario: Saving
- **WHEN** the user discards the first preview and clicks "Save all"
- **THEN** only the second is saved, as a page annotation with no `selected`

#### Scenario: Requests on a selection are unchanged
- **WHEN** the AI modal is opened on a selection and a request is generated
- **THEN** the request has `segments` and no `subject`, and the proposals are placed, previewed and saved as before
