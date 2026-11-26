## 1. Events

- [x] 1.1 Add `AnnotationEvent.DiscardPreviewTriple` and `AppEvent.AiPreviewTripleDiscard`
- [x] 1.2 `AnnotationEH`: click source `'discard-triple'` → emit `DiscardPreviewTriple` with `{ id, index }`
- [x] 1.3 `SidebarLayoutAnnotationHandler`: relay `DiscardPreviewTriple` → `AiPreviewTripleDiscard`
- [x] 1.4 `MainLayoutEditModalHandler`: on `AiPreviewTripleDiscard` call `aiHandler.discardAiPreviewTriple(id, index)`

## 2. AI handler

- [x] 2.1 `discardAiPreviewTriple(id, index)`: guards (unknown id, not Linking, bad index, ≤1 triple), immutable payload update, refresh cached annotation via `annotationService.add`
- [x] 2.2 Keep preview CSS state after the update (check `add` class reset)
- [x] 2.3 Specs: removes triple, keeps order, "Save all" saves reduced payload, guards are no-ops

## 3. Card UI

- [x] 3.1 `SemanticAnnotationSectionComponent`: `emit`/`annotationId` inputs, `index` per triple, `canDiscardTriple`, click handler with `stopImmediatePropagation`
- [x] 3.2 Template: ✕ button (icon `times`) per triple when `canDiscardTriple`; track by index
- [x] 3.3 `annotation.html`: pass `emit` and `annotationId` to the semantic section
- [x] 3.4 i18n `annotation#discard_triple_title` in `en_US.ts`; style in `_annotation.scss`
- [x] 3.5 Specs: button only for previews with >1 triple, index preserved across subject groups

## 4. Verification

- [x] 4.1 `npm test` and `npm run lint` green
- [x] 4.2 Manual: generate semantic previews, discard triples down to one (✕ hidden), save all, check saved triples
