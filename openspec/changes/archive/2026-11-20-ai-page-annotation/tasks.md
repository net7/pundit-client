## 1. Model

- [x] 1.1 `src/communication/model/request/ai-annotate-request.interface.ts`: `AiAnnotateSubject`, `AiAnnotateRequest.subject?`, `segments?`, `AiAnnotateContext.text?`, with JSDoc (design D1)
- [x] 1.2 `src/communication/model/response/ai-annotate-response.interface.ts`: `AiAnnotation.target` is `AiAnnotationTarget | null`; JSDoc of `target` and of a triple without `subject` (the annotated passage, or the page)

## 2. Page text and request

- [x] 2.1 `ai-page-context.util.ts`: `PAGE_TEXT_LIMIT = 6000` and `getPageText(root)`, same walker and filter as the text around a selection, from the first text node forward (design D2)
- [x] 2.2 `buildWholePageContext()`: metadata + `text`, empty fields left out, `undefined` when title, description and text are all empty (design D3)
- [x] 2.3 `annotation-range-selector.util.ts`: `preparePageAiRequest(prompt, annotationType)` → `{ subject: 'page', prompt, annotation_type, context }` or `null`; `prepareAiRequest` unchanged

## 3. Proposals

- [x] 3.1 `annotation-llm-helpers.util.ts`: `addPayloadForPage(annotation, annotationPayload, requestedType)`: a copy of the pending payload with `applyAnnotationType`, `subject` untouched
- [x] 3.2 `annotation-llm-processor.ts`: `processPageAiResponse(annotations, annotationPayload, requestedType)`: one payload per annotation with `target === null`, in order; those with a target or without content skipped (design D5)
- [x] 3.3 `edit-modal-validation.ts`: `isValidAnnotationPayload` accepts a payload without `selected` that has a comment, tags or triples; payloads with `selected` checked as today

## 4. Modal and entry point

- [x] 4.1 `request-section.ts` / `.html`: `AiRequestSectionOptions.annotationTypes?` filters and orders the offered types; the first offered one is the default without an initial value (design D4)
- [x] 4.2 Sidebar: `ai` in the "Add Page Annotation" dropdown and in `labels.fullpage.options` (label `tooltip#aiRequest`)
- [x] 4.3 `main-layout-app-events.handler.ts`: `onFullPageAnnotationCreate('ai')` warns without an active AI key, else opens the modal with the `aiRequest` section and the page types
- [x] 4.4 `main-layout-edit-modal-ai.handler.ts`: `onAiGenerate` branches on `pendingPayload.subject.selected`; the page branch draws no pending highlight, sends `preparePageAiRequest` and builds the previews with `processPageAiResponse`

## 5. Specs

- [x] 5.1 Page text: short page, 6,000 limit without split words, long word cut at the character, script/style/`pnd-root` skipped, words split by formatting kept whole, page without DOM text
- [x] 5.2 `preparePageAiRequest`: request with `subject: 'page'` and no `segments`; metadata only; `null` when nothing to send; `prepareAiRequest` still sends no `subject` and no `context.text`
- [x] 5.3 `processPageAiResponse`: one comment, several tag groups in order, semantic with and without element subject, proposal without content or with a target skipped; `processLLMResponse` still skips annotations without a target
- [x] 5.4 `isValidAnnotationPayload`: page payload with a comment, with tags, with triples; page payload with no content; payloads with a selection as before
- [x] 5.5 AI request section: offered types and default with and without `annotationTypes`
- [x] 5.6 `MainLayoutEditModalAiHandler`: page generate renders the previews without drawing the pending highlight; "no results" when nothing is sent or nothing is usable; "Save all" saves page payloads; discard one; the selection flow untouched
- [x] 5.7 `onFullPageAnnotationCreate('ai')`: modal config with the page types; warning toast without an active key

## 6. Verification

- [x] 6.1 `npm test`, lint on touched files, `tsc --noEmit`; `npx openspec validate ai-page-annotation`
- [x] 6.2 By hand on a page with text and on a PDF: one comment, "three comments", tags, semantic; previews in the page annotations list, no highlight in the page, "Save all" saves page annotations; an AI request on a selection behaves as before
