## ADDED Requirements

### Requirement: AI annotate request through the communication layer
The client SHALL send AI annotation requests as `POST /ai/annotate` on `CommunicationSettings.apiBaseUrl` through the communication layer's `request$` provider, with the `refreshHook` after-hook, like every other annotation-backend API. The request body SHALL match the backend contract: `chunks` (array of `{ id, text }`), `prompt`, `annotation_type` (one of `highlight`, `comment`, `tags`, `semantic_annotation`) and optional `selected_text`.

#### Scenario: Request shape
- **WHEN** the user generates AI annotations
- **THEN** the client issues `POST {apiBaseUrl}/ai/annotate` with JSON body `{ chunks, prompt, annotation_type, selected_text }`
- **AND** the request carries `Authorization: Bearer <access_token>` when a token is set
- **AND** no request is sent to a hardcoded host

#### Scenario: Expired token
- **WHEN** the AI request fails with HTTP 401
- **THEN** the token is refreshed and the request is retried, as for other APIs

### Requirement: AI requests use the cross-message model
The AI request SHALL be exposed as `AiModel.annotate` decorated with `@CrossMessage(CrossMsgRequestId.AiAnnotate)`, and the chrome-extension background SHALL handle `CrossMsgRequestId.AiAnnotate` by calling `AiModel.annotate`, so that in the extension the request runs in the background like the other models.

#### Scenario: Chrome extension
- **WHEN** the AI request is made from the chrome-extension content page
- **THEN** it is dispatched as a cross-message with request id `ai.annotate`
- **AND** the background performs the HTTP call and returns the response to the page

#### Scenario: Embed and web builds
- **WHEN** the AI request is made outside the chrome extension
- **THEN** `AiModel.annotate` calls the communication layer directly

### Requirement: AI service normalizes the response
An `AiService` SHALL call `AiModel.annotate` and return `{ toolCalls, contiguousCalls }` as arrays, built from the response fields `result` and `contiguous_chunks`, accepting either JSON arrays or JSON-encoded strings and treating missing or unparseable fields as empty arrays.

#### Scenario: Array response
- **WHEN** the backend returns `{ result: [...], contiguous_chunks: [...] }`
- **THEN** the service returns those arrays as `toolCalls` and `contiguousCalls`

#### Scenario: String or missing fields
- **WHEN** a field is a JSON-encoded string, missing, or not valid JSON
- **THEN** the service returns the parsed array, or an empty array when missing or invalid

### Requirement: AI generate flow and error handling
The AI generate flow SHALL prepare the request from the DOM, call `AiService.annotate`, convert the response to preview payloads with the existing LLM processing, and render previews. Errors whose response carries a known `code` (`payload_too_large`, `no_active_api_key`, `structured_output_unsupported`, `model_unavailable`, `invalid_structured_output`), or an HTTP 413 from any layer (treated as `payload_too_large`), SHALL show an AI error toast with a code-specific message; any other HTTP or network error SHALL show the generic AI error toast and go through the layout error handler; a successful response with no usable annotations SHALL show the "no results" info toast. Accepting previews SHALL save them through the standard `layoutDS.saveAnnotation` flow.

#### Scenario: Successful generation
- **WHEN** the backend returns annotations that map to the selected text
- **THEN** preview annotations are rendered and the preview state is activated

#### Scenario: Known backend error code
- **WHEN** the AI request fails with a response body whose `code` is `payload_too_large`, `no_active_api_key`, `structured_output_unsupported`, `model_unavailable` or `invalid_structured_output`, or with HTTP 413 and no known code (e.g. a proxy's HTML 413)
- **THEN** the working toast is closed and the "AI annotation failed" toast is shown with the message for that code
- **AND** the error is logged with its code and backend detail, without going through the layout error handler

#### Scenario: Other backend or network error
- **WHEN** the AI request fails without a known `code` (e.g. HTTP 400 before the backend sends `no_active_api_key`, 500, network error)
- **THEN** the working toast is closed, the generic AI error toast is shown and the error is passed to the layout error handler

#### Scenario: Empty result
- **WHEN** the backend responds successfully but no preview payloads can be built
- **THEN** the "no results" info toast is shown and no previews are rendered

### Requirement: Standard Save flow without AI branches
The edit-modal Save SHALL build the request payload synchronously from the form state and save a single annotation through `layoutDS.saveAnnotation` (create) or emit the update events (update), with no AI generation step and no multi-payload handling.

#### Scenario: Create from the edit modal
- **WHEN** the user saves a new annotation from the edit modal
- **THEN** exactly one annotation is created via `layoutDS.saveAnnotation` and the created flow (signal, toast, tags, analytics) runs once

#### Scenario: Update closes the modal synchronously
- **WHEN** the user saves an update to an existing annotation
- **THEN** `CommentUpdate` and the modal-close signal are emitted synchronously within the save handler

### Requirement: No dead AI code or debug logging
Code made unreachable by this change or by the AI work (raw fetch, `mapChunks`, AI branch of the Save flow, unused helpers, variants and labels) SHALL be removed, and debug `console.warn` logging in the AI flow SHALL be removed, keeping `console.error` for real failures.

#### Scenario: Static check
- **WHEN** the project is type-checked with `--noUnusedLocals --noUnusedParameters` on the touched files
- **THEN** no unused locals or parameters are reported in the AI flow files
- **AND** no `console.warn` debug calls remain in the AI flow files
