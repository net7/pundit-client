## Why

The AI-assisted annotation work merged from PR #2 calls the backend with a raw `fetch` to a hardcoded development host (`https://app.thepund.test/ai/annotate`), bypassing the communication layer used by every other API. In stage and prod the call goes to the wrong host; it sends no Bearer token and gets no 401 refresh; in the chrome extension it runs from the page instead of the background like all other requests. The same work also rewrote the standard edit-modal Save into an async, array-based flow to support an AI branch that is no longer reachable, and left a lot of debug logging.

## What Changes

- Add `ai.annotate` to `src/communication` (`POST /ai/annotate` on `apiBaseUrl`, via `request$` with `refreshHook`), with typed request/response models matching the backend contract.
- Add `AiModel.annotate` with `@CrossMessage(CrossMsgRequestId.AiAnnotate)` and register it in the chrome-extension background dispatcher.
- Add `AiService` (`src/app/services`) that calls `AiModel` and normalizes the response, injected into `MainLayoutDS` like the other services.
- Rework the AI generate flow: DOM preparation (`prepareAiRequest`) → `AiService.annotate` → existing `processLLMResponse` → previews. Remove `mapChunks`/`fetchAiAnnotations` and the raw `fetch`.
- HTTP errors from the AI call now show an "AI annotation failed" toast instead of the "no results" info toast: a code-specific message for the backend's known error codes (`payload_too_large`, `no_active_api_key`, `structured_output_unsupported`, `model_unavailable`, `invalid_structured_output`; a 413 from any layer counts as `payload_too_large`), a generic AI message otherwise (via `handleError`); "no results" remains for a valid empty response.
- Restore the standard edit-modal Save to `develop`'s synchronous flow (`EditModalPayloadBuilder` + `layoutDS.saveAnnotation`), removing the unreachable AI branch, `saveAnnotationsSequentially` and array handling; the update-close spec returns to its synchronous form.
- Remove dead code left by the AI work and debug `console.warn` logs (keep `console.error` for real failures).

## Capabilities

### New Capabilities
- `ai-annotation-requests`: AI annotation requests go through the communication layer like every other API (communication → model with cross-message → service), with defined error handling, and the standard annotation Save flow stays free of AI-specific branches.

### Modified Capabilities
- `in-repo-communication-layer`: the public API gains the `ai` namespace; its "Single import specifier" requirement now also covers AI calls, and no direct `fetch` to the annotation backend is allowed outside `src/communication`.

## Impact

- New code: `src/communication/ai/*`, request/response interfaces in `src/communication/model/*`, `src/common/models/ai-model.ts`, `src/app/services/ai.service.ts`, specs.
- Affected code: `src/common/types.ts`, `src/common/models/index.ts`, `src/chrome-ext/src/background/helpers/doCrossMessageRequest.ts`, `src/app/layouts/main-layout/main-layout.ds.ts`/`main-layout.ts`, `main-layout-edit-modal.handler.ts`, `main-layout-edit-modal-ai.handler.ts`, `annotation-range-selector.util.ts`, `annotation-llm-*.ts`, `src/testing/communication.mock.ts`, edit-modal AI section/types.
- Backend dependency: the client will call `POST {apiBaseUrl}/ai/annotate` with Bearer auth. The backend serving `apiBaseUrl` must expose that route with token auth (outside this repo); until then the AI feature fails with an error toast.
- No change to the AI preview / accept / discard UX.
- Out of scope: i18n for the hardcoded "Generate"/"Save All" labels, a specific message for the backend's 400 "no active API key" error.
