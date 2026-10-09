## Context

PR #2 (Federico Gueli, Duccio Breschi), now merged into `feature/ai-annotation`, adds AI-assisted annotation: from the tooltip the user opens an edit modal with an AI prompt section, clicks Generate, sees preview annotations, and accepts ("Save All") or discards them.

Current request path:
- `MainLayoutEditModalAiHandler.onAiGenerate` → `mapChunks` (`annotation-range-selector.util.ts`) → `fetchAiAnnotations` → raw `fetch('https://app.thepund.test/ai/annotate', { credentials: 'include' })` → manual JSON parsing → `processLLMResponse` → previews.
- The URL is the local development host of `pundithomex`. Auth relies on the session cookie, with no Bearer token and no 401 refresh. In the chrome extension the call runs in the page, not in the background like every other request.

Standard annotation path, which the AI flow should mirror:
- handler → `layoutDS.saveAnnotation` → `AnnotationService.create` → `AnnotationModel.create` (`@CrossMessage(AnnotationCreate)`) → `src/communication` `annotation.create` (`request$`, `apiBaseUrl`, `refreshHook`).
- In the extension, `CrossMessage` dispatches to the background (`doCrossMessageRequest.ts`), which calls the same model.

The PR also rewrote the regular Save (`main-layout-edit-modal.handler.ts`). Every Save now goes through `aiHandler.getEditRequestPayload` (async), and the result is saved as an array with `saveAnnotationsSequentially`. The AI branch inside Save is unreachable: when the AI section is present, the modal shows Cancel / Generate / Save All (`AiAccept`) and never emits `Save`.

Backend contract (`pundithomex` `AiAnnotateController`):
- **Request:** `chunks[]{id,text}`, `prompt`, `annotation_type ∈ {highlight, comment, tags, semantic_annotation}`, `selected_text?`.
- **Response:** `{ result, contiguous_chunks }`.
- **Errors:** `400 { error }` when there is no active AI key; `500 { error, message }`.

Agreed with the user: base URL is `apiBaseUrl`; the backend serving it will expose the route with Bearer auth (outside this repo).

## Goals / Non-Goals

**Goals:**
- AI requests follow the same layering as annotations: communication → model (`@CrossMessage`) → service → handler.
- No hardcoded host and no direct `fetch` outside `src/communication`.
- The standard Save is back to `develop`'s synchronous single-annotation flow.
- Remove dead code and debug `console.warn` from the AI flow.

**Non-Goals:**
- No changes to the AI UX (prompt section, previews, accept/discard), to `processLLMResponse` / merge / range-matching logic, or to the backend.
- No dedup refactor of `onAnnotationCreated` duplicated between the two handlers beyond what dead-code removal requires.

## Decisions

**Decision: Full layering (communication → `AiModel` → `AiService`).**
- Mirrors `annotation.create` → `AnnotationModel.create` → `AnnotationService.create`.
- `AiModel` gives the chrome-extension background path for free.
- `AiService` owns response normalization, keeps the DOM utilities free of transport concerns, and can be tested on its own.

Alternatives rejected:
- Calling `AiModel` directly from the util: normalization would stay in DOM code and the flow would diverge from annotations.
- Communication only, without a model: in the extension the request would still run in the page.

**Decision: Typed contract in `src/communication/model`.**
- `AiAnnotateRequest` and `AiAnnotateResponse` interfaces live in `model/request` and `model/response`, following the existing layout.
- `annotation_type` is a string-literal union matching the backend validation.
- The client stops sending the duplicate camelCase `annotationType` field, which the backend ignores.

**Decision: Orchestration in the handler; DOM prep and processing stay as utilities.**
- `onAiGenerate` calls `prepareAiRequest` (DOM: restore range, build/filter chunks, compute `selected_text`), then `aiService.annotate`, then `processLLMResponse`, then `renderAiPreviews`.
- `mapChunks` and `fetchAiAnnotations` are removed.
- This matches how the Save handler orchestrates payload build → service.

**Decision: `AiService` returns an Observable; the handler bridges with `firstValueFrom`.**
- Services in this codebase return Observables (`AnnotationService.create`).
- `onAiGenerate` is already async, so it awaits `firstValueFrom(aiService.annotate(...))`.

**Decision: Errors surface as errors.**
- HTTP/network failures reject.
- `onAiGenerate` catches them and closes the working toast.
- Errors with a known backend `code` show the "AI annotation failed" toast with a short, code-specific i18n message, and are logged (`code` + backend `message`) instead of going through `handleError` (they are not auth errors; `handleError` would only log them as unhandled). Codes: `payload_too_large` (413; also any 413 without a known code, e.g. nginx's HTML page), `no_active_api_key` (400, to be added by the backend; until then the 400 falls back to the generic case), `structured_output_unsupported` (422), `model_unavailable` (422), `invalid_structured_output` (502).
- Any other error calls `layoutEH.handleError(e)` (keeping 401/403 → logout) and shows a generic AI error toast.
- Messages are client i18n keys (en_US; `it_IT` is empty) rather than the backend's Italian `error` text, which also embeds the model name the client does not receive separately.
- "No results" is shown only for a successful but empty outcome.
- Previously failures were swallowed into "no results".
- `handleError` already routes 401/403 to logout like other requests; the 401 refresh happens first via `refreshHook`.

**Decision: Restore `develop`'s Save, keep `EditModalPayloadBuilder`.**
- `onEditModalSave` returns `of({ requestPayload, isUpdate })` for updates and `layoutDS.saveAnnotation(payload)` for creates.
- The payload is built with `EditModalPayloadBuilder.applyFormValuesToPayload`, the PR's extraction of the form → payload mapping, kept as the current behavior.
- `onEditModalSaveEvent` returns to the `isUpdate` / `onAnnotationCreated` branches.
- The update-close spec returns to `develop`'s synchronous version.

**Decision: Dead-code inventory is mechanical.**
- After the refactor, run `tsc --noEmit --noUnusedLocals --noUnusedParameters` scoped to the touched files.
- Grep references for exported symbols, i18n keys and union variants.
- Remove what is unreferenced or unreachable: the `parseAiRequest` string branch and the `AiRequestSectionValue` string variant only if no emitter produces a string; `editmodal#save_ai_request` / `saveButtonLabel` only if not rendered.

**Decision: Tests.**
- `src/communication/ai/annotate.spec.ts`: URL, method, `baseURL`, body, `refreshHook`, with `request$` mocked.
- `src/app/services/ai.service.spec.ts`: normalization of array / string / missing / invalid fields; error propagation, with `AiModel` mocked.
- Existing app specs keep the communication stub, which gains an `ai` namespace.
- The handler update-close spec is restored to synchronous.

## Risks / Trade-offs

- **Backend route on `apiBaseUrl` with Bearer auth not deployed yet:** the AI feature fails with an error toast until it is. Mitigation: proposal and PR note the dependency; the error is visible instead of silent.
- **Restoring the synchronous Save changes timing:** low risk, since it is exactly `develop`'s proven flow, and the builder is unchanged. Covered by the existing handler spec, which goes back to the synchronous form.
- **Removing the `parseAiRequest` string branch breaks an unseen emitter:** only removed after confirming every emitter sends `{ prompt, annotationType }`. TypeScript then flags any caller passing a string.
- **Showing errors instead of "no results" changes perceived behavior:** intended, agreed with the user.

## Migration Plan

1. Communication `ai` module + types + stub update.
2. `CrossMsgRequestId.AiAnnotate`, `AiModel`, background registration.
3. `AiService`, wired into `MainLayoutDS`.
4. AI handler + util refactor (`prepareAiRequest`), raw fetch removed.
5. Save flow restored, spec back to synchronous.
6. Dead code + debug logs removed.
7. Specs, verification (tsc, lint, jest, builds), manual check in the stage extension once the backend route exists.

Rollback: revert the change's commits; behavior returns to the raw-fetch version.

## Open Questions

- Exact availability date of `POST {apiBaseUrl}/ai/annotate` with Bearer auth on stage (backend team).
