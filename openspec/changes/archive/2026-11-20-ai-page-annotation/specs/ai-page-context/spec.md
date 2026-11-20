## MODIFIED Requirements

### Requirement: The AI request carries the page context
An AI annotate request on a selection SHALL carry, besides `segments`, `prompt` and `annotation_type`, an optional `context` object with the optional string fields `title`, `site`, `description`, `before` and `after`, for every annotation type. A field that would be empty SHALL be left out; `context` SHALL be left out when all its fields are. `segments` SHALL stay exactly the selection. It SHALL NOT carry `subject` nor `context.text`: those belong to a request on the whole page (`ai-page-annotation`).

#### Scenario: Request with context
- **WHEN** the page titled "The Merchant of Venice" has "Act I. Scene 1." before the selected "Her name is Portia" and "nothing undervalued" after it
- **THEN** the request has the same `segments` as before and `context` is `{ title: "The Merchant of Venice", site: "localhost", before: "Act I. Scene 1.", after: "nothing undervalued" }` (with the spaces at the selection side as in the page)

#### Scenario: Nothing to send
- **WHEN** the page has no title, no metadata, no host name and no text outside the selection
- **THEN** the request has no `context` key

#### Scenario: No page fields on a selection
- **WHEN** a request is built for a selection on a page with a long text
- **THEN** the request has no `subject` key and its `context` has no `text` key
