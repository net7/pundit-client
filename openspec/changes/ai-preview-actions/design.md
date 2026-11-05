## Context

`MainLayoutEditModalAiHandler` renders AI results as preview annotations with ids `ai-preview-<index>`: it adds an anchor (`highlightAiPreviewTag`), adds the annotation to `AnnotationService` (state class `is-preview`) and keeps the payloads in an array. `removeAiPreviews` rebuilds ids from the array indexes; "Save all" (`onAiAccept`) saves the whole array.

Sidebar cards are the generic `pnd-annotation` component. Card clicks go `AnnotationEH.handleClickEvent` (by `source`) → `emitOuter(AnnotationEvent.*)` → `SidebarLayoutAnnotationHandler` → shared `appEvent$` (`AppEvent.*`) → main layout handlers. The main layout's edit-modal handler owns the AI handler but listens only to `outerEvents$` (edit modal events).

`MenuHeaderSection.getMenuData` returns the owner's menu because previews carry the current user's id; `getShareData` returns share data when the notebook is public; the social section is always rendered in the expanded template.

## Goals / Non-Goals

**Goals:**
- No backend-bound action reachable from a preview card.
- Discard a single preview from its card.
- "Save all" consistent with the previews left.

**Non-Goals:**
- Editing a preview (comment, tags, semantic) before saving.
- Changing how previews are generated, highlighted or saved.
- Discarding previews from the page highlight (only from the sidebar card).

## Decisions

### D1. One `isAiPreviewId(id)` helper
Move `AI_PREVIEW_ID_PREFIX` and add `isAiPreviewId(id?: string): boolean` in a small shared module (`src/app/models/ai-preview.ts`). Use it in the AI handler, `AnnotationService.add` (state class), `annotation.html` (`is-preview` class, via a component getter), menu header and the discard flow. Avoids the prefix string spread in five places.

### D2. Hide actions at the data level, not only in CSS
`getMenuData` and `getShareData` return `null` for preview ids, so the existing `@if` blocks render nothing and no click payload exists. The social section is wrapped in `@if (!isPreview)` in `annotation.html`. CSS-only hiding was rejected: buttons would still be in the DOM and reachable by keyboard.

### D3. Discard button in place of the actions menu
In the card header (`menu-header-section`), a preview shows a ✕ button (icon `times`, same `pnd-annotation__header-menu-button` style, tooltip from `annotation#discard_preview_title`) where saved annotations show the ⋮ menu. It goes through the header's `onClick`, which stops the click from reaching the card container, and emits `{ source: 'discard-preview', id }`. Like the menu, it is in the expanded card.

### D4. Event path reuses the existing chain
- `AnnotationEH`: new `'discard-preview'` click handler → `emitOuter(AnnotationEvent.DiscardPreview, id)`.
- `SidebarLayoutAnnotationHandler`: `[AnnotationEvent.DiscardPreview]` → `appEvent$.next({ type: AppEvent.AiPreviewDiscard, payload: id })`.
- `MainLayoutEditModalHandler.listen`: also subscribes to `layoutEH.appEvent$`, filtered on `AppEvent.AiPreviewDiscard`, calling `aiHandler.discardAiPreview(id)`; unsubscribed on `layoutEH.destroy$`.
Alternative rejected: calling the AI handler from the sidebar directly — breaks the layout separation the rest of the app follows.

### D5. `Map<string, payload>` for previews
`aiPreviewPayloads: any[]` becomes `aiPreviews = new Map<string, any>()` (insertion order preserved, so "Save all" keeps the generation order).
- `renderAiPreviews`: `set(previewId, payload)`.
- `discardAiPreview(id)`: if the id is not in the map, no-op. Otherwise `anchorService.remove(id)`, `annotationService.removeCached(id)`, `delete(id)`, emit `AppEvent.AiPreviewClear` (sidebar refresh, already wired to `updateAnnotations(true)`); if the map is now empty, `aiPreviewState$.next(false)`.
- `removeAiPreviews`: iterate the map keys (plus the existing `removeByPrefix` on anchors), then `clear()`.
- `onAiAccept`: `Array.from(map.values())`.
Ids stay `ai-preview-<index>` from generation; after a discard they are no longer contiguous, which is fine since nothing derives ids from indexes any more.

## Risks / Trade-offs

- [Discard while a save is running] → `onAiAccept` already clears previews before saving, so no card is left to discard.
- [`AiPreviewClear` reused for a partial removal] → its only consumer refreshes the sidebar list, which is what a single discard needs; no new sidebar event required.
- [The button is in the expanded card only, like the menu] → the user expands a preview to read it before discarding it.

## Migration Plan

Client-only, no stored data involved. Rollback: revert the change.

## Open Questions

None.
