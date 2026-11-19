## Why

An AI annotation request carries exactly the selected text (`ai-selection-range`), and nothing else. A short selection is often ambiguous on its own: "she" or "the Duke" says nothing about who is meant, a date says nothing about what happened, and a list of names says nothing about the work they come from. A reader would glance at the page title and at the sentences around the selection; the model cannot. Now that the AI also proposes triples about ontology elements (`ai-element-subjects`), picking the right entity matters even more. The request can carry the page's context, used only to understand the selection, never annotated.

## What Changes

- The AI annotate request gains an optional `context` object: `title`, `site`, `description` (page metadata) and `before`, `after` (page text right before and right after the selection). Every field is optional; an empty field is left out; no `context` at all when every field is empty. `segments` stays exactly the selection.
- Metadata come from the page head: title from `og:title`, else `document.title`; site from `og:site_name`, else the host name; description from `<meta name="description">`, else `og:description`.
- `before` / `after` are taken by characters, up to 1,500 per side, from the page's text nodes in document order, starting right at the selection's boundary nodes (the same nodes the segments are built from). Script, style, noscript and template content and Pundit's own interface are skipped; existing highlights are read as page text. Nodes are joined as they are (no added spaces, so words split by formatting or highlights stay whole), whitespace runs are collapsed, and the cut moves back to the nearest space so no word is split.
- A page with no text in the DOM around the selection (e.g. a PDF rendered on canvas) sends only the metadata.
- The client only extracts: the server stays free to shorten each field.
- Sent for every annotation type.

## Capabilities

### New Capabilities

- `ai-page-context`: the page context sent with an AI annotate request — fields, metadata sources and fallbacks, extraction of the text around the selection, omission rules.

### Modified Capabilities

<!-- none: the segments and the response are unchanged -->

## Impact

- Communication model: `src/communication/model/request/ai-annotate-request.interface.ts` (`AiAnnotateContext`, `AiAnnotateRequest.context?`).
- New pure utility `src/app/layouts/main-layout/handlers/ai-page-context.util.ts` (metadata, text around the selection), with specs.
- `annotation-range-selector.util.ts` (`prepareAiRequest` adds `context`), its spec.
- Out of scope: other metadata (`citation_*`, Dublin Core, JSON-LD, keywords), structure-aware extraction (paragraphs, block types).
