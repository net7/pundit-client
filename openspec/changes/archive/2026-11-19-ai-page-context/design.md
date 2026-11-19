## Context

`prepareAiRequest` restores the pending selection with `anchor()` (as highlights are) and builds the segments with `buildSegmentProjection`, which walks `wholeTextNodesInRange(range)`. That call splits the text nodes at the selection's start and end, so after it the first segment node starts exactly where the selection starts and the last one ends exactly where it ends. Pundit's interface lives in `pnd-root` (its content in a shadow root); highlights are `pnd-mark` / `pnd-mark-preview` elements wrapping page text.

## Goals / Non-Goals

**Goals:**
- Give the model what a reader sees around a selection: page title, site, description, and the text right before and after.
- Keep extraction simple, deterministic and testable with jsdom.
- Leave `segments`, the response and the placement untouched.

**Non-Goals:**
- Structure-aware extraction (paragraphs, headings, block types).
- Other metadata vocabularies (`citation_*`, Dublin Core, JSON-LD, keywords).
- Length budgets on the client: the server shortens each field as it needs.

## Decisions

### D1. `context` on the request

```ts
export type AiAnnotateContext = {
  title?: string;
  site?: string;
  description?: string;
  before?: string;
  after?: string;
};
export type AiAnnotateRequest = { segments; prompt; annotation_type; context?: AiAnnotateContext };
```

Only non-empty strings are sent; `context` is left out when it would be empty, so a request without context is byte-for-byte today's one. Alternative: always send every key with `""` — dropped, it adds noise and the contract treats an empty field as absent.

### D2. Two pure utilities

`ai-page-context.util.ts` exports:

- `getPageMetadata(doc = document)`: reads `meta[property="og:title"]` → `doc.title`; `meta[property="og:site_name"]` → `doc.location.hostname`; `meta[name="description"]` → `meta[property="og:description"]`. A fallback is used when the first source is missing or blank. Values are trimmed and their whitespace collapsed.
- `getTextAround(first, last, root = document.body)`: the text before `first` and after `last`, the first and last text nodes of the selection.
- `buildPageContext(first?, last?)`: metadata plus text around, empty fields left out, `undefined` when nothing is left.

They take nodes, not the `Range`: after `wholeTextNodesInRange` the boundary nodes already start and end at the selection, so before/after are simply "all text nodes before the first one" and "all text nodes after the last one", and they meet the segments with no gap or overlap. Calling `wholeTextNodesInRange` a second time on the same range would split again at the old offset and produce empty nodes. `prepareAiRequest` passes the first and last nodes of the segment map.

### D3. Walking the text

A `TreeWalker` on `document.body` with `SHOW_TEXT` and a filter that skips text inside `script`, `style`, `noscript`, `template` and `pnd-root`. Starting from the boundary node it goes `previousNode()` for `before`, `nextNode()` for `after`, stopping as soon as more than 1,500 characters are collected (one more than needed, to know whether the cut falls inside a word). No look at the page structure: highlights and inline formatting are just text nodes.

Each node's whitespace runs are collapsed to one space before counting: indentation and newlines between tags would otherwise eat most of the 1,500 characters. Nodes are joined as they are, with no added space, and a double space at a junction is reduced to one: a word split by inline formatting or by a highlight (`<b>Bol</b>sena`, `wa<pnd-mark>nt-wit</pnd-mark>`) stays whole. Telling inline from block boundaries would need the page structure (a list of inline tags or computed styles), which this extraction avoids. Alternative: a space between nodes glued without whitespace — dropped, it splits every word broken by formatting or highlights, and names are what the model most needs to read.

### D4. Cutting without splitting words

`before` keeps its last 1,500 characters, `after` its first 1,500. When the cut falls inside a word, the edge moves back toward the selection to the nearest space; with no space in the kept text, it cuts at the character. The outer edge is trimmed; a side that is empty or whitespace only is left out (selection at the start or end of the document, page with no DOM text such as a canvas PDF).

### D5. Every annotation type

The context is built once in `prepareAiRequest`, for every `annotation_type`. It is never placed or annotated by the client: the response is read as today.

## Risks / Trade-offs

- [Blocks with no whitespace between them in the markup read glued, e.g. `end.</p><h2>Title` → "end.Title"] → accepted: indented pages have whitespace nodes between blocks (collapsed to one space), and glued sentences stay readable for the model, unlike split words.
- [Navigation, footers or cookie banners next to the selection end up in the context] → accepted: the server only uses context to understand the selection, and the text closest to it comes first.
- [Very large pages] → walking stops after 1,500 characters per side; the filter only checks the ancestors of the nodes visited.
- [Metadata of an embedding viewer (e.g. a PDF viewer) instead of the document] → the same title the user sees in the tab; acceptable as context.
