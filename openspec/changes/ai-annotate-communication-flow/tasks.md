## 1. Baseline

- [x] 1.1 Confirm a clean working tree on `feature/ai-annotation` and record a green baseline: `tsc --noEmit` on the four tsconfig projects, `npm run lint`, `npm test`, `npm run build:chrome-ext-stage` — clean tree; tsc 0 errors (4 projects, excluding the pre-existing local `./local.prod` TS2307); lint clean; 13 suites / 37 tests; build ok
- [x] 1.2 Record the current dead-code baseline: `tsc --noEmit --noUnusedLocals --noUnusedParameters` output for the AI flow files (`src/app/layouts/main-layout/handlers/*`, `src/app/components/edit-modal/**`) — 1 pre-existing hit outside the AI flow (`main-layout-selection.handler.ts:14`, unused `layoutDS`); out of scope

## 2. Communication layer

- [x] 2.1 Add `AiAnnotateRequest` (`model/request/ai-annotate-request.interface.ts`) and `AiAnnotateResponse` (`model/response/ai-annotate-response.interface.ts`) and export them from the model indexes
- [x] 2.2 Add `src/communication/ai/annotate.ts` (`request$('/ai/annotate', { baseURL: apiBaseUrl, method: 'post', data, hooks: { after: refreshHook } })`) and `ai/index.ts`; export `ai` from `src/communication/index.ts`
- [x] 2.3 Add the `ai` namespace to `src/testing/communication.mock.ts`
- [x] 2.4 Add `src/communication/ai/annotate.spec.ts` (URL, method, baseURL, body, refreshHook; `request$` mocked)

## 3. Model and chrome-extension background

- [x] 3.1 Add `CrossMsgRequestId.AiAnnotate = 'ai.annotate'` in `src/common/types.ts`
- [x] 3.2 Add `src/common/models/ai-model.ts` with `AiModel.annotate` decorated `@CrossMessage(CrossMsgRequestId.AiAnnotate)`; export it from `src/common/models/index.ts`
- [x] 3.3 Register `[CrossMsgRequestId.AiAnnotate]: (args) => AiModel.annotate.apply(null, args)` in `doCrossMessageRequest.ts`

## 4. Service

- [x] 4.1 Add `src/app/services/ai.service.ts` (`providedIn: 'root'`): `annotate(request): Observable<{ toolCalls: any[]; contiguousCalls: any[] }>` via `from(AiModel.annotate(request))`, normalizing `result` / `contiguous_chunks` (array, JSON string, missing, invalid → `[]`)
- [x] 4.2 Inject `AiService` in `MainLayoutComponent` and pass it to `MainLayoutDS` like the other services (`layoutDS.aiService`) — `main-layout.ds.ts` crossed the 300-line `max-lines` limit; added a justified file-level disable (repo convention)
- [x] 4.3 Add `src/app/services/ai.service.spec.ts` (normalization cases, error propagation; `AiModel` mocked)

## 5. AI generate flow

- [x] 5.1 Replace `mapChunks` / `fetchAiAnnotations` in `annotation-range-selector.util.ts` with `prepareAiRequest(annotationPayload, prompt, annotationType)` returning `{ request: AiAnnotateRequest, chunkMap } | null`
- [x] 5.2 Rework `MainLayoutEditModalAiHandler.onAiGenerate`: `prepareAiRequest` → `await firstValueFrom(layoutDS.aiService.annotate(request))` → `processLLMResponse` → `renderAiPreviews`; on error close the working toast, call `layoutEH.handleError(e)` and show the generic error toast; show "no results" only for an empty successful outcome — plus `main-layout-edit-modal-ai.handler.spec.ts` (success, backend error, empty result, no text, unknown type)
- [x] 5.3 Verify no `fetch(` and no `thepund.test` remain under `src/` outside `src/communication` — `thepund.test` gone; the two remaining `fetch` calls (`doImageDataRequest`, `isPdfDocument`) fetch page resources, not the annotation backend

## 6. Standard Save flow

- [x] 6.1 Restore `onEditModalSave` / `onEditModalSaveEvent` in `main-layout-edit-modal.handler.ts` to `develop`'s synchronous single-annotation flow, building the payload with `EditModalPayloadBuilder.applyFormValuesToPayload`
- [x] 6.2 Remove `saveAnnotationsSequentially` and the array branch from the edit-modal handler, and `getEditRequestPayload` / `generateAiPayloads` from the AI handler
- [x] 6.3 Restore `main-layout-edit-modal.handler.spec.ts` to `develop`'s synchronous version and confirm it passes (and fails if the update branch stops emitting the close signal)

## 7. Dead code and debug logs

- [ ] 7.1 Run `tsc --noEmit --noUnusedLocals --noUnusedParameters` scoped to the touched files and remove unused locals, params and imports
- [ ] 7.2 Check emitters of `AiGenerate`; if none sends a string, remove the `parseAiRequest` string branch and the `AiRequestSectionValue` string variant
- [ ] 7.3 Check `editmodal#save_ai_request` / `saveButtonLabel` for the AI modal; remove if not rendered
- [ ] 7.4 Remove unreferenced exports/files left by the refactor (grep each symbol)
- [ ] 7.5 Remove debug `console.warn` calls from the AI flow files (`annotation-*.ts`, `main-layout-edit-modal-ai.handler.ts`, AI section); keep `console.error` for real failures

## 8. Verification

- [ ] 8.1 `tsc --noEmit` on the four tsconfig projects, `npm run lint`, `npm test`
- [ ] 8.2 `npm run build`, `npm run build:chrome-ext-stage`, `npm run build:pdf-standalone-stage`; grep bundles for `thepund.test` (expect 0) and `ai/annotate` (expect present)
- [ ] 8.3 Manual check (developer) on stage once `POST {apiBaseUrl}/ai/annotate` with Bearer auth is available: generate, preview, accept, discard, error toast when the backend fails, standard comment/tag/semantic save unchanged
