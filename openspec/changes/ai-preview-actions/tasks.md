## 1. Preview id helper

- [ ] 1.1 Add `src/app/models/ai-preview.ts` with `AI_PREVIEW_ID_PREFIX` and `isAiPreviewId(id?)`, with spec
- [ ] 1.2 Replace the `startsWith('ai-preview-')` checks in `annotation.service.ts`, `annotation.html` and the AI handler with the helper

## 2. AI handler preview map

- [ ] 2.1 Replace `aiPreviewPayloads` array with `Map<string, any>` in `MainLayoutEditModalAiHandler` (`renderAiPreviews`, `removeAiPreviews`, `onAiAccept`)
- [ ] 2.2 Add `discardAiPreview(id)`: remove anchor, cached annotation and map entry, emit `AiPreviewClear`, set `aiPreviewState$` false when empty; no-op on unknown id
- [ ] 2.3 Specs: discard one of several, discard last disables save, save after discard saves only remaining, unknown id no-op, cancel after discard removes the rest

## 3. Discard event path

- [ ] 3.1 Add `AnnotationEvent.DiscardPreview` and `AppEvent.AiPreviewDiscard`
- [ ] 3.2 `AnnotationEH`: `'discard-preview'` click source emits `DiscardPreview` (spec)
- [ ] 3.3 `SidebarLayoutAnnotationHandler`: forward `DiscardPreview` to `appEvent$` as `AiPreviewDiscard`
- [ ] 3.4 `MainLayoutEditModalHandler`: subscribe to `appEvent$` for `AiPreviewDiscard` → `aiHandler.discardAiPreview` (spec)

## 4. Card UI

- [ ] 4.1 `MenuHeaderSection`: `getMenuData`/`getShareData` return null for preview ids
- [ ] 4.2 `annotation.html`/`annotation.ts`: `isPreview` getter, hide social section for previews, Discard button (icon `times`) in both states with `stopPropagation`
- [ ] 4.3 i18n `annotation#discardpreview` in `en_US.ts`
- [ ] 4.4 Styles for the Discard button in `.is-preview` cards (`_annotation.scss`), no overlap with header in expanded state

## 5. Verification

- [ ] 5.1 `npm test` and `npm run lint` green
- [ ] 5.2 Manual: generate previews, check no menu/share/social, discard one, save all, discard all, cancel
