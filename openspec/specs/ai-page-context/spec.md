# ai-page-context Specification

## Purpose

Define the page context sent with an AI annotate request to help the model understand the selection: page metadata and their fallbacks, extraction of the text before and after the selection, and the rules for leaving fields out.

## Requirements
### Requirement: The AI request carries the page context
An AI annotate request SHALL carry, besides `segments`, `prompt` and `annotation_type`, an optional `context` object with the optional string fields `title`, `site`, `description`, `before` and `after`, for every annotation type. A field that would be empty SHALL be left out; `context` SHALL be left out when all its fields are. `segments` SHALL stay exactly the selection.

#### Scenario: Request with context
- **WHEN** the page titled "The Merchant of Venice" has "Act I. Scene 1." before the selected "Her name is Portia" and "nothing undervalued" after it
- **THEN** the request has the same `segments` as before and `context` is `{ title: "The Merchant of Venice", site: "localhost", before: "Act I. Scene 1.", after: "nothing undervalued" }` (with the spaces at the selection side as in the page)

#### Scenario: Nothing to send
- **WHEN** the page has no title, no metadata, no host name and no text outside the selection
- **THEN** the request has no `context` key

### Requirement: Page metadata and fallbacks
The client SHALL read `title` from `<meta property="og:title">`, else `document.title`; `site` from `<meta property="og:site_name">`, else the page host name; `description` from `<meta name="description">`, else `<meta property="og:description">`. A source missing or blank SHALL fall back to the next one. Values SHALL be trimmed with whitespace runs collapsed. No other metadata SHALL be read.

#### Scenario: Open Graph first
- **WHEN** the page has `og:title` "Portia" and `<title>` "Portia – Wiki"
- **THEN** `title` is "Portia"

#### Scenario: Fallbacks
- **WHEN** the page has no Open Graph tags, `<title>` "Portia – Wiki", no `description` meta but `og:description` "A heiress"
- **THEN** `title` is "Portia – Wiki", `site` is the host name and `description` is "A heiress"

#### Scenario: Blank meta
- **WHEN** `og:title` has an empty `content`
- **THEN** `title` falls back to `document.title`

### Requirement: Text around the selection
`before` SHALL be the text of the page's text nodes preceding the selection, `after` the text of those following it, in document order, starting at the same boundary nodes the segments are built from, up to 1,500 characters per side, without looking at the page structure. Text inside `script`, `style`, `noscript`, `template` and Pundit's interface (`pnd-root`) SHALL be skipped; existing highlights SHALL be read as page text. Whitespace runs SHALL be collapsed to one space; nodes SHALL be joined as they are, without adding spaces, so words split by inline formatting or highlights stay whole. When the limit falls inside a word, the cut SHALL move back toward the selection to the nearest space, or cut at the character when there is none. A side that is empty SHALL be left out.

#### Scenario: Limit without split words
- **WHEN** the text before the selection is 3,000 characters of words separated by spaces
- **THEN** `before` is at most 1,500 characters, ends where the page text meets the selection and starts with a whole word

#### Scenario: Long word at the limit
- **WHEN** the text after the selection is one 2,000-character word
- **THEN** `after` is its first 1,500 characters

#### Scenario: Skipped content
- **WHEN** a `<script>`, a `<style>` and the `pnd-root` element sit between the selection and the next paragraph
- **THEN** `after` holds the next paragraph's text and none of theirs

#### Scenario: Highlights read as text
- **WHEN** the text before the selection contains an existing highlight "Bassanio"
- **THEN** `before` contains "Bassanio" in place

#### Scenario: Words split by formatting
- **WHEN** the page has `lake <b>Bol</b>sena` or a highlight inside "want-wit" (`wa<pnd-mark>nt-wit</pnd-mark>`)
- **THEN** the text reads "lake Bolsena" and "want-wit"

#### Scenario: Nodes joined as they are
- **WHEN** a paragraph ending with "end." is followed by a heading "Title" with no whitespace between them
- **THEN** the text reads "end.Title"; with a newline between them it reads "end. Title"

#### Scenario: Selection at the start or end of the document
- **WHEN** the selection starts at the first text of the page
- **THEN** `before` is left out; likewise `after` when it ends at the last text

#### Scenario: Page without DOM text
- **WHEN** the page has no text nodes outside the selection (e.g. a PDF drawn on canvas)
- **THEN** only the metadata are sent

