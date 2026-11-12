## Why

The server specification of `POST /ai/annotate` has changed. Every proposed annotation now comes with its position already computed (segment, quote with context, UTF-16 offsets), semantic annotations use predicates and objects taken from the user's selected ontologies, and the old request and response shapes are no longer served. The client must speak the new contract and is released together with the server.

## What Changes

- **BREAKING** Request: `chunks` becomes `segments` and holds every text node of the selection in reading order, the boundary nodes cut at the selection's edges, **including whitespace-only nodes** (only empty `""` nodes are skipped). Texts are sent untrimmed: joined, they are exactly the selection. `selected_text` is removed. `prompt` and `annotation_type` are unchanged. Whitespace-only segments are also kept in the id → node map.
- **BREAKING** Response: a single `annotations` list, one entry per position, each with `type`, a `target` (`segment`, `end_segment`, `exact`, `prefix`, `suffix`, `start`, `end`) and the fields of its type (`comment`, `tags`, `triples`); a semantic annotation carries in `triples` all the triples whose subject is its passage, in the order the model proposed them. `result`, `contiguous_chunks`, `words_counter`, `chunkId`/`quote`, snake_case variants and JSON-encoded string fields are gone.
- Placement: the client builds the DOM Range directly from `start`/`end` (UTF-16 offsets on the segment text nodes). It anchors with `exact`/`prefix`/`suffix` when the offsets are null (ambiguous occurrence) or when the Range text does not match `exact` (page changed meanwhile); when that also fails, the annotation is skipped.
- Removed client-side guessing: `findQuoteIndex`, `positionsSameWords`, the `words_counter` branch, `processContiguousToolCall` and the whole merge of calls on contiguous chunks (`annotation-llm-merge.util.ts`).
- Semantic content: the `triples` carry real ontology elements; each place of the text gives one Linking annotation whose content holds all its triples, in their order. A triple with an element object becomes `{ predicate: { label, uri }, objectType: 'uri', object: { uri, label, description?, source: 'search', elementType } }`, the same shape as an object picked from the element search in the semantic modal. When the object is a literal value read from the text (`{ text }`: a date as `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, a number, a measure), it becomes `{ predicate: { label, uri }, objectType: 'literal', object: { text } }`, the literal shape already stored by the annotation server. An incomplete triple is left out; the annotation is skipped when none is left. `buildLabelUri()` and its fixed map of nine labels are removed.
- Comments arrive already HTML-escaped and tags already normalized by the server: the client uses them as they are.
- New error codes, semantic annotation only, all HTTP 422: `no_predicates`, `no_elements`, `ontology_too_large`, with their `toast#ai_error_<code>` messages. Their toasts stay open with a "Select ontologies" button that opens the Ontologies panel (the place where the user fixes them), like the AI-settings errors offer the AI settings.
- The saved annotation payload keeps its shape.
- The "Semantic" annotation type, hidden in the AI request section until the server could propose real ontology elements, is offered again next to comment, highlight and tags.

## Capabilities

### New Capabilities
- `ai-annotation-placement`: turning each positioned annotation of the response into a preview payload — Range from offsets, quote fallback, safety check, skip, and the content of each annotation type (comment, tags, semantic triples).

### Modified Capabilities
- `ai-annotation-requests`: request body (`segments`, no `selected_text`), response normalization (`annotations` list), generate flow error codes (three new semantic codes, ontology-panel action).
- `ai-annotate-selection`: segments include whitespace-only text nodes and are sent untrimmed; no `selected_text`.

## Impact

- Communication models: `src/communication/model/request/ai-annotate-request.interface.ts`, `src/communication/model/response/ai-annotate-response.interface.ts`.
- `src/app/services/ai.service.ts`.
- `src/app/layouts/main-layout/handlers/`: `annotation-range-selector.util.ts`, `annotation-range-utils.ts`, `annotation-llm-processor.ts`, `annotation-llm-helpers.util.ts`, `main-layout-edit-modal-ai.handler.ts`; `annotation-llm-merge.util.ts` deleted.
- `src/app/components/edit-modal/sections/aiRequest-section/request-section.ts`: the `semantic_annotation` option is shown again.
- i18n `en_US.ts` (`it_IT.ts` is an empty placeholder).
- Jest specs: `annotate.spec.ts`, `ai.service.spec.ts`, `annotation-range-selector.util.spec.ts`, `main-layout-edit-modal-ai.handler.spec.ts`, `request-section.spec.ts`; new spec for the processor (`annotation-llm-processor.spec.ts`).
- Server: ships the new contract at the same time; no compatibility with the old shape is kept on either side.
