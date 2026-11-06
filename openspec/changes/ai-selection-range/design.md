## Context

`prepareAiRequest` restores the pending annotation's range with `restoreRangeFromXPath` (the XPath of `rangeSelector`, offsets applied to the first text node of the element, clamped) or `restoreRangeFromTextQuote` (first text node containing the quote), then `buildChunkProjection` sends every non-empty text node intersecting the range, whole. `@net7/annotator` (already used by `AnchorService` to highlight) records `rangeSelector` offsets relative to the element's text and anchors them correctly, with a quote check and fallbacks.

## Goals / Non-Goals

**Goals:** send the model exactly the selected text; restore the selection the way highlights are restored.

**Non-Goals:** the selectors of the annotations built from the AI answer (`serializeRangeToSelector`); they anchor through the quote check and fallbacks of `anchor()`. Changing the prompt or the answer processing.

## Decisions

### D1. Shared selector building
`getAnnotationSelectors(selected)` (new, `src/app/models/annotation/annotation-selectors.ts`) builds the `SelectorWithType[]` from `subject.selected`; `AnchorService.createSelectors` uses it, and so does the AI request. One definition of "the selectors of an annotation".

### D2. `prepareAiRequest` anchors with `anchor()`
`prepareAiRequest` becomes async: `anchor(document.body, getAnnotationSelectors(selected))`; on failure it returns null (no request, "no results" toast, as today when the range cannot be restored). `restoreRangeFromXPath`, `restoreRangeFromTextQuote`, `restoreRangeFromPayload` and `toTextNode` are removed; `positionsSameWords` moves to `annotation-range-utils.ts` and `annotation-range-restore.ts` is deleted.

### D3. Chunks from `wholeTextNodesInRange`
`buildChunkProjection(range)` takes `wholeTextNodesInRange(range)` (splits the boundary nodes, returns the nodes inside), keeps the non-empty ones, ids `c1…`. The `chunkMap` holds those nodes, so quotes found by the model are located inside the selection.

### D4. Pending highlight first
`onAiGenerate` awaits `anchorService.add(pendingAnnotation)` before building the request. Highlighting splits and wraps the same text nodes; doing it first means the nodes kept in `chunkMap` are not split again afterwards (a later split would leave the original node with only its first part).

## Risks / Trade-offs

- [`wholeTextNodesInRange` changes the DOM (splits text nodes)] → the highlight of the same selection does the same split; the text of the page is unchanged.
- [The model sees less context than before (no boundary text)] → intended: it must annotate only the selection.
