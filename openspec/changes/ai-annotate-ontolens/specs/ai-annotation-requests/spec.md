## MODIFIED Requirements

### Requirement: AI annotate request through the communication layer
The client SHALL send AI annotation requests as `POST /ai/annotate` on `CommunicationSettings.apiBaseUrl` through the communication layer's `request$` provider, with the `refreshHook` after-hook, like every other annotation-backend API. The request body SHALL match the backend contract: `segments` (array of `{ id, text }`), `prompt` and `annotation_type` (one of `highlight`, `comment`, `tags`, `semantic_annotation`), and no other field (`selected_text` is no longer sent).

#### Scenario: Request shape
- **WHEN** the user generates AI annotations
- **THEN** the client issues `POST {apiBaseUrl}/ai/annotate` with JSON body `{ segments, prompt, annotation_type }`
- **AND** the body has no `chunks` and no `selected_text`
- **AND** the request carries `Authorization: Bearer <access_token>` when a token is set
- **AND** no request is sent to a hardcoded host

#### Scenario: Expired token
- **WHEN** the AI request fails with HTTP 401
- **THEN** the token is refreshed and the request is retried, as for other APIs

### Requirement: AI service normalizes the response
An `AiService` SHALL call `AiModel.annotate` and return the `annotations` list of the response as an array, in the order received. A missing or non-array `annotations` SHALL be returned as an empty array. The service SHALL NOT read `result` or `contiguous_chunks` and SHALL NOT parse JSON-encoded strings.

#### Scenario: Annotations list
- **WHEN** the backend returns `{ annotations: [...] }`
- **THEN** the service returns that array unchanged

#### Scenario: Missing or malformed list
- **WHEN** `annotations` is missing, `null`, a string or an object
- **THEN** the service returns an empty array

#### Scenario: Request error
- **WHEN** the request fails (HTTP or network)
- **THEN** the error is propagated to the caller

### Requirement: AI generate flow and error handling
The AI generate flow SHALL prepare the request from the DOM, call `AiService.annotate`, turn the returned annotations into preview payloads as specified by `ai-annotation-placement`, and render previews. Errors whose response carries a known `code` (`payload_too_large`, `no_active_api_key`, `invalid_api_key`, `provider_quota_exceeded`, `provider_rate_limited`, `provider_timeout`, `provider_unavailable`, `provider_host_not_found`, `provider_url_blocked`, `structured_output_unsupported`, `model_unavailable`, `invalid_structured_output`, `no_predicates`, `no_elements`, `ontology_too_large`), or a response without a known code whose HTTP status is 413, 429 or 504 from any layer (treated as `payload_too_large`, `provider_rate_limited` and `provider_timeout`), SHALL show an AI error toast with a code-specific message (i18n key `toast#ai_error_<code>`); for the codes the user fixes in the AI settings (`no_active_api_key`, `invalid_api_key`, `provider_quota_exceeded`, `provider_unavailable`, `provider_host_not_found`, `provider_url_blocked`, `structured_output_unsupported`, `model_unavailable`, `invalid_structured_output`) the toast SHALL stay open and offer a button that opens the AI settings page of the web app (`<userLink>settings/ai`) in a new tab; for the codes the user fixes in the ontology selection (`no_predicates`, `no_elements`, `ontology_too_large`) the toast SHALL stay open and offer a "Select ontologies" button that opens the Ontologies panel; any other HTTP or network error SHALL show the generic AI error toast and go through the layout error handler; a successful response with no usable annotations SHALL show the "no results" info toast. Accepting previews SHALL save them through the standard `layoutDS.saveAnnotation` flow.

#### Scenario: Successful generation
- **WHEN** the backend returns annotations whose targets are found in the selection
- **THEN** preview annotations are rendered and the preview state is activated

#### Scenario: Known backend error code
- **WHEN** the AI request fails with a response body whose `code` is one of the known codes, or with HTTP 413, 429 or 504 and no known code (e.g. a proxy's HTML page)
- **THEN** the working toast is closed and the "AI annotation failed" toast is shown with the message for that code
- **AND** the error is logged with its code and backend detail, without going through the layout error handler

#### Scenario: Error fixed in the AI settings
- **WHEN** the known `code` is `no_active_api_key`, `invalid_api_key`, `provider_quota_exceeded`, `provider_unavailable`, `provider_host_not_found`, `provider_url_blocked`, `structured_output_unsupported`, `model_unavailable` or `invalid_structured_output`
- **THEN** the AI error toast does not close by itself and shows an "Open AI settings" button
- **AND** clicking the button opens `<userLink>settings/ai` in a new tab and closes the toast

#### Scenario: Error fixed in the ontology selection
- **WHEN** the request fails with HTTP 422 and `code` `no_predicates`, `no_elements` or `ontology_too_large`
- **THEN** the AI error toast shows the message for that code, does not close by itself and shows a "Select ontologies" button
- **AND** clicking the button opens the Ontologies panel and closes the toast

#### Scenario: Other backend or network error
- **WHEN** the AI request fails without a known `code` (e.g. HTTP 400 before the backend sends `no_active_api_key`, 500, network error)
- **THEN** the working toast is closed, the generic AI error toast is shown and the error is passed to the layout error handler

#### Scenario: Empty result
- **WHEN** the backend responds successfully but no preview payloads can be built (empty list, or every annotation skipped)
- **THEN** the "no results" info toast is shown and no previews are rendered

#### Scenario: Retry after a failed or empty generation
- **WHEN** a generation ends with an error or with no results
- **THEN** the Generate button is enabled again, also for the same prompt and annotation type
- **AND** while previews are shown, Generate stays disabled for the same prompt and type
