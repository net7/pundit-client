## Why

Pundit annotates either a passage or the whole page: a page annotation is created from the sidebar ("Add Page Annotation") as tags, a comment or a semantic annotation. The AI only works on a selection: the request is built from the selected text and every proposed annotation is placed inside it. A user who wants a summary of the page, its keywords or the facts it states has to write them by hand. The AI can do it as it does for a passage, reading what the page says: its title, its description and the beginning of its text.

## What Changes

- "Add Page Annotation" gains an "AI annotation" entry. It opens the AI modal on the page, with the annotation types that make sense for it: comment, tag, semantic. A page has no highlight.
- An AI request on the page says so with `subject: "page"`, carries no `segments`, and carries a `context` with the page metadata (as for a selection, see `ai-page-context`) and a new field, `text`: the beginning of the page's readable text, up to 6,000 characters. No `before` / `after`: there is no selection.
- The response annotations come with `target: null`. Each one becomes a page annotation: a copy of the pending page annotation with the proposed content. The request usually yields one; several when the user's task asks for them ("three comments", "one group of tags for the places and one for the people").
- Previews of page proposals are cards in the page annotations list, with no highlight in the page. "Save all" saves each one left as a page annotation; a single preview can be discarded as today.
- Requests on a selection are unchanged.

## Capabilities

### New Capabilities

- `ai-page-annotation`: AI annotations of the whole page — entry point and annotation types, the request (`subject`, `context.text`, extraction of the page text), page proposals without a target, their previews and saving.

### Modified Capabilities

- `ai-page-context`: the requirement on the request is scoped to requests on a selection; a request on the page carries its own context, defined in `ai-page-annotation`.

## Impact

- Communication model: `src/communication/model/request/ai-annotate-request.interface.ts` (`AiAnnotateSubject`, `subject?`, `segments?`, `AiAnnotateContext.text?`), `src/communication/model/response/ai-annotate-response.interface.ts` (`target` nullable).
- `ai-page-context.util.ts`: `getPageText()`, `buildPageContext()` for the page; `annotation-range-selector.util.ts`: `preparePageAiRequest()`.
- `annotation-llm-processor.ts` / `annotation-llm-helpers.util.ts`: payloads of page proposals; `edit-modal-validation.ts`: a page payload is valid without a selection.
- `main-layout-edit-modal-ai.handler.ts`: page branch of generate, previews and save; `main-layout-app-events.handler.ts`: the AI modal of a page annotation, with the missing-key warning.
- `request-section` (AI request section): the offered annotation types become an option; sidebar dropdown and labels.
- Out of scope: reading the whole text of long pages, structure-aware extraction (main content detection), AI highlights of a page.
