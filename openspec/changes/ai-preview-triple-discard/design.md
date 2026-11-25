## Context

AI previews are built by `MainLayoutEditModalAiHandler.renderAiPreviews`: each payload is stored in `aiPreviews: Map<previewId, payload>` and turned into a cached annotation (`annotationService.getAnnotationFromPayload` + `annotationService.add`). "Save all" (`onAiAccept`) saves `Array.from(aiPreviews.values())`. The `ai-preview-actions` change already wires the whole-preview discard: card button → `AnnotationEH` (`source: 'discard-preview'`) → `AnnotationEvent.DiscardPreview` → `SidebarLayoutAnnotationHandler` → `AppEvent.AiPreviewDiscard` → `MainLayoutEditModalHandler` → `aiHandler.discardAiPreview(id)`.

The card's semantic section (`SemanticAnnotationSectionComponent`) only gets `data$`; it groups `annotation.content` in subject runs (`toSubjectRuns`) and loses the original triple index.

## Goals / Non-Goals

**Goals:**
- Remove one triple from a semantic preview before saving.
- Keep the last triple: the preview is dropped only via the card ✕.
- "Save all" saves the reduced payloads.

**Non-Goals:**
- Editing triples (predicate/object) in a preview.
- Undo of a triple discard.
- Triple discard on saved annotations, or on comment/tags previews.

## Decisions

### D1. Same event path as the preview discard
Semantic section gets `emit` and `annotationId` inputs (like `pnd-menu-header-section`) and emits `click` with `{ id, source: 'discard-triple', index }`, stopping propagation so the container click does not toggle the card. `AnnotationEH` maps `'discard-triple'` → `emitOuter(AnnotationEvent.DiscardPreviewTriple, { id, index })`; `SidebarLayoutAnnotationHandler` relays to `AppEvent.AiPreviewTripleDiscard`; `MainLayoutEditModalHandler` calls `aiHandler.discardAiPreviewTriple(id, index)`.
Alternative rejected: mutating the annotation inside the component — the payload for "Save all" lives in the AI handler, so the change must happen there.

### D2. Index in `annotation.content`
`transformTriple` keeps `index` (position in `annotation.content`). Grouping does not reorder triples, but the index stays the stable reference regardless of groups. The `@for` tracks by `triple.index`.

### D3. Immutable payload update
Pure helper `withoutPreviewTriple(payload, index)` in `src/app/models/ai-preview.ts` (keeps the AI handler under the 300-line lint limit) returns the new payload or `null`. `discardAiPreviewTriple(id, index)`: no-op if id unknown, payload not `Linking`, index out of range, or content length ≤ 1 (last-triple guard in the handler too, not only in the UI). Otherwise build `{ ...payload, content: content.filter((_, i) => i !== index) }`, `aiPreviews.set(id, next)`, then `annotationService.add(getAnnotationFromPayload(id, next))`: `add` on an existing id calls `data$.next`, so the card re-renders without a sidebar refresh. Anchor untouched (highlight does not depend on triples).
Shallow copy because `getAnnotationFromPayload` assigns `payload.content` by reference: never splice the shared array.

### D4. Visibility of the button
Shown when `isAiPreviewId(annotationId)` and total triples > 1. Computed in the component view model (`canDiscardTriple`). Icon `times`, tooltip `annotation#discard_triple_title`. Discreet icon button (no border/background) in the top-right corner of the object box; the object text keeps room on the right.

## Risks / Trade-offs

- [`add` also resets state classes to empty] → for previews this dropped the `is-preview` CSS class from `state.classes`: `add` now resets them to `AnnotationCssClass.Preview` for preview ids (saved annotations unchanged).
- [Stale index if two clicks race] → indexes are re-derived on each `data$` emission; handler checks range.

## Migration Plan

Client-only, no stored data. Rollback: revert.

## Open Questions

None.
