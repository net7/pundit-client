## Context

A page annotation is an annotation whose `subject` has no `selected`: only `pageContext` (the URL), `pageTitle` and the metadata. The sidebar creates it from the "Add Page Annotation" dropdown (`tagging`, `commenting`, `linking`): `onFullPageAnnotationCreate` adds a pending annotation and opens the edit modal with the page title as `textQuote`. The sidebar lists page annotations and passage annotations in two separate views (`showPageAnnotations$`).

The AI modal opens only from the selection tooltip. `onAiGenerate` builds the request with `prepareAiRequest`, which restores the selection and returns `null` without one; `processLLMResponse` places each annotation with its `target` and skips those it cannot place; `saveAnnotationsSequentially` saves only payloads with a selection (`isValidAnnotationPayload`). The AI request section always offers four annotation types, `highlight` first by default.

`ai-page-context.util.ts` already reads the page metadata and walks the page text nodes, skipping `script`, `style`, `noscript`, `template` and `pnd-root`.

## Goals / Non-Goals

**Goals:**
- Ask the AI for comments, tags and triples about the whole page, from the place where page annotations are created.
- Reuse the AI modal, the previews, "Save all" and the error handling as they are.
- Keep requests on a selection byte-for-byte as today.

**Non-Goals:**
- Reading the whole text of a long page: only its beginning is sent.
- Finding the main content of a page (article detection, navigation removal).
- AI highlights of a page: a highlight is its passage.
- Placing page proposals in the text.

## Decisions

### D1. The request says its subject

```ts
export type AiAnnotateSubject = 'selection' | 'page';

export type AiAnnotateContext = {
  title?: string;
  site?: string;
  description?: string;
  before?: string;
  after?: string;
  /** Beginning of the page text; only in a request on the page. */
  text?: string;
};

export type AiAnnotateRequest = {
  /** Absent: the selection. */
  subject?: AiAnnotateSubject;
  /** Absent in a request on the page. */
  segments?: AiAnnotateSegment[];
  prompt: string;
  annotation_type: AiAnnotationType;
  context?: AiAnnotateContext;
};
```

A request on the page is `{ subject: 'page', prompt, annotation_type, context }`, with no `segments` key. A request on a selection never sends `subject`, so it stays today's request. Alternative: a page request recognised by the missing `segments` — dropped: a selection that fails to produce segments would silently become a page annotation; with an explicit subject it stays an error.

In the response `AiAnnotation.target` becomes `AiAnnotationTarget | null`: `null` is an annotation on the page.

### D2. Page text: the beginning, by characters

`getPageText(root = document.body)` in `ai-page-context.util.ts` returns the first 6,000 characters of the page's readable text: the same `TreeWalker` and filter as the text around a selection (D3 of `ai-page-context`), from the first text node forward, each node's whitespace collapsed, nodes joined as they are, the cut moved back to the nearest space, the result trimmed. It stops walking as soon as more than 6,000 characters are collected. Empty when the page has no DOM text.

`buildPageContext()` stays the builder for a selection; `buildWholePageContext()` returns the metadata plus `text`, empty fields left out. The limit is a constant next to `PAGE_CONTEXT_TEXT_LIMIT`. The server may shorten the text further.

Alternative: the text of `<main>` or `<article>` when present — dropped for now: it needs rules per page type, and the beginning of the body already holds the title and the lead on most pages.

### D3. The request is still sent with metadata only

A page whose text is not in the DOM (a PDF drawn on canvas) sends the metadata alone. When there is no title, no description and no text, nothing is sent and the "no results" toast shows, as for a selection with no text. The server decides whether what it receives is enough.

### D4. Entry point and annotation types

The dropdown gains `ai`, labelled like the tooltip entry ("AI annotation"). `onFullPageAnnotationCreate('ai')` checks the active AI key as the tooltip does (same warning toast with the link to the AI settings), then opens the modal with the page title as `textQuote` and one section:

```ts
{ id: 'aiRequest', required: true, focus: true,
  options: { label: _t('editmodal#ai_label'), annotationTypes: ['comment', 'tags', 'semantic_annotation'] } }
```

`AiRequestSectionOptions.annotationTypes?` lists the types to offer, in order; absent means all four, as today. The first offered type is the default when no initial value is given, so the page modal starts on "Comment" and the selection modal still starts on "Highlight".

### D5. Page proposals become page annotations

`onAiGenerate` branches on the pending payload: with `subject.selected` it runs today's flow; without, the page flow.

- Request: `preparePageAiRequest(prompt, annotationType)` → `AiAnnotateRequest | null` (D1, D3). No pending highlight is drawn.
- Payloads: `processPageAiResponse(annotations, annotationPayload, requestedType)`. For each annotation with `target === null`, a copy of the pending payload with `applyAnnotationType` applied and its `subject` left as it is (no `selected`). An annotation that carries a target, or lacks the content of its type, is skipped. Symmetrically, `processLLMResponse` keeps skipping annotations without a target.
- A semantic triple without `subject` is saved with no `subjectType`: it is about the annotated thing, here the page. Triples with an element subject are saved as today.
- Previews: `renderAiPreviews` is unchanged. `anchorService.add` finds no selector and draws nothing; `annotationService.add` adds the card, which the sidebar shows in the page annotations view, already open since the dropdown lives there.
- Saving: `isValidAnnotationPayload` accepts a payload without `selected` when it has the content of its type (a comment, tags, or triples); a payload with `selected` is checked as today. "Save all" and "discard one" are unchanged.

### D6. Nothing new in the error handling

Error codes, toasts and their actions are those of a selection. A response with no usable annotation shows the "no results" toast.

## Risks / Trade-offs

- [The beginning of the page is navigation, a cookie banner or a table of contents] → accepted for now; the metadata still describe the page, and main-content detection can replace `getPageText` later without touching the request.
- [Long pages are read only in part] → the limit keeps the request small and fast; the model is told the text is the beginning of the page.
- [Several proposals look alike in the sidebar, with no passage to tell them apart] → each card shows its own content; a single one can be discarded before "Save all".
- [A page annotation needs tags, a comment or triples to be saved, and an AI proposal has only one of them] → the content of its type is enough for `isValidAnnotationPayload`; the manual modal keeps its own required fields.
