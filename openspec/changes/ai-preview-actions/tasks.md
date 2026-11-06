## 1. Preview id helper

- [x] 1.1 Add `src/app/models/ai-preview.ts` with `AI_PREVIEW_ID_PREFIX` and `isAiPreviewId(id?)`, with spec
- [x] 1.2 Replace the `startsWith('ai-preview-')` checks in `annotation.service.ts`, `annotation.html` and the AI handler with the helper

## 2. AI handler preview map

- [x] 2.1 Replace `aiPreviewPayloads` array with `Map<string, any>` in `MainLayoutEditModalAiHandler` (`renderAiPreviews`, `removeAiPreviews`, `onAiAccept`)
- [x] 2.2 Add `discardAiPreview(id)`: remove anchor, cached annotation and map entry, emit `AiPreviewClear`, set `aiPreviewState$` false when empty; no-op on unknown id
- [x] 2.3 Specs: discard one of several, discard last disables save, save after discard saves only remaining, unknown id no-op, cancel after discard removes the rest

## 3. Discard event path

- [x] 3.1 Add `AnnotationEvent.DiscardPreview` and `AppEvent.AiPreviewDiscard`
- [x] 3.2 `AnnotationEH`: `'discard-preview'` click source emits `DiscardPreview` (spec)
- [x] 3.3 `SidebarLayoutAnnotationHandler`: forward `DiscardPreview` to `appEvent$` as `AiPreviewDiscard`
- [x] 3.4 `MainLayoutEditModalHandler`: subscribe to `appEvent$` for `AiPreviewDiscard` → `aiHandler.discardAiPreview` (spec)

## 4. Card UI

- [x] 4.1 `MenuHeaderSection`: `getMenuData`/`getShareData` return null for preview ids
- [x] 4.2 `annotation.html`/`annotation.ts`: `isPreview()`, hide social section for previews; `menu-header-section`: ✕ Discard button (icon `times`) in place of the ⋮ menu
- [x] 4.3 i18n `annotation#discard_preview_title` (button tooltip) in `en_US.ts`

## 5. Verification

- [x] 5.1 `npm test` and `npm run lint` green
- [ ] 5.2 Manual: generate previews, check no menu/share/social, discard one, save all, discard all, cancel
