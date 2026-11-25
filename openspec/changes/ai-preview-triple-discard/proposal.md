## Why

AI semantic previews (type `Linking`, ids prefixed `ai-preview-`) often bundle several triples, some useful and some not. Today the user can only keep or discard a preview as a whole, so one wrong triple forces either saving it (and deleting/editing later on the backend) or dropping the good ones too. The user should pick the triples to keep while the annotation is still temporary.

## What Changes

- In an expanded AI preview card, each triple of the semantic section gets a **Discard triple** button (✕).
- Clicking it removes only that triple from the preview: the card re-renders without it and the payload kept for "Save all" no longer contains it.
- When a preview has a single triple left, the per-triple ✕ is hidden: the whole preview is dropped with the existing card Discard (✕ in the header).
- "Save all" saves each remaining preview with only its remaining triples.
- Saved (non-preview) annotations are unchanged: no per-triple button.
- No backend changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ai-preview-annotations`: adds discarding a single triple of a semantic preview before saving (capability introduced by the pending `ai-preview-actions` change).

## Impact

- `semantic-annotation-section.ts`/`.html`: `emit` + `annotationId` inputs, triple index kept in the view model, ✕ button for previews with more than one triple.
- `annotation.html`: passes `emit`/`annotationId` to the semantic section.
- `annotation.eh.ts`: new click source `discard-triple`.
- `annotation.events.ts` (`AnnotationEvent.DiscardPreviewTriple`), `app.events.ts` (`AppEvent.AiPreviewTripleDiscard`).
- `sidebar-layout-annotation.handler.ts`, `main-layout-edit-modal.handler.ts`: event relay.
- `main-layout-edit-modal-ai.handler.ts`: `discardAiPreviewTriple(id, index)`.
- `en_US.ts` (tooltip), `_annotation.scss`, specs.
