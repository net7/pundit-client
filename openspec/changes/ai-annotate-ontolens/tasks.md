## 1. Contract types

- [x] 1.1 `ai-annotate-request.interface.ts`: `AiAnnotateChunk` → `AiAnnotateSegment`; `AiAnnotateRequest` = `{ segments, prompt, annotation_type }` (drop `chunks`, `selected_text`)
- [x] 1.2 `ai-annotate-response.interface.ts`: add `AiAnnotationTarget`, `AiAnnotationTriple`, `AiAnnotation`; `AiAnnotateResponse` = `{ annotations }`; remove `AiAnnotateCall`; add `no_predicates`, `no_elements`, `ontology_too_large` to `AiAnnotateErrorCode`
- [x] 1.3 Update `src/communication/ai/annotate.spec.ts` to the new request/response shape
- [x] 1.4 `AiAnnotationTriple.object`: union of the element object and the literal object `{ text }`

## 2. Request

- [x] 2.1 `annotation-range-utils.ts`: `buildChunkProjection` → `buildSegmentProjection`, keep every node whose text is not `""` (whitespace-only included), text untrimmed, all segments in the map; remove `positionsSameWords`
- [x] 2.2 `annotation-range-selector.util.ts`: `prepareAiRequest` returns `{ request: { segments, prompt, annotation_type }, segmentMap }`, no `selected_text`, no `range.toString()`
- [x] 2.3 `annotation-range-selector.util.spec.ts`: rename chunks → segments; across paragraphs the whitespace-only node is a segment and the joined segments equal the selection; a test with a whitespace-only node between two nodes (untrimmed texts, node in the map, no `selected_text`)

## 3. Service

- [x] 3.1 `ai.service.ts`: `annotate()` returns `Observable<AiAnnotation[]>` from `data.annotations` (array) or `[]`; remove `AiAnnotateResult` and `toCallList`
- [x] 3.2 `ai.service.spec.ts`: annotations list returned as-is; missing/null/string/object → `[]`; errors propagated

## 4. Placement and payloads

- [x] 4.1 `annotation-llm-processor.ts`: `locateTarget` (offsets → Range, `exact` check, `isConnected`/unknown-id skip) and `anchorQuote` (joined segment text, window `segment`…`end_segment`, prefix/suffix scoring, first on tie, map back to node/offset, final check)
- [x] 4.2 `annotation-llm-processor.ts`: `processLLMResponse(annotations, segmentMap, annotationPayload, requestedType)` loops in response order with a per-item `try/catch`; remove the single/contiguous/merge machinery
- [x] 4.3 Delete `annotation-llm-merge.util.ts`
- [x] 4.4 `annotation-llm-helpers.util.ts`: `addPayloadForRange(range, annotation, annotationPayload, requestedType)` returns the payload or null; `applyAnnotationType` on the four request values (fallback to the requested type) and returns false on missing content; `buildSemanticContent(triple)` → search-picked `uri` object (`description` only when present) or `literal` object `{ text }` (trimmed, skipped when empty); remove `buildLabelUri` and `SEMANTIC_TYPES`
- [x] 4.5 New `annotation-llm-processor.spec.ts` (jsdom): one-segment offsets; cross-segment through a whitespace-only segment; emoji before the passage (offsets applied as received); null offsets with prefix choosing the second occurrence; null offsets without context → first occurrence; `exact` mismatch → quote fallback; mismatch and quote not found → skipped; unknown segment → skipped, others kept; semantic content with `source: 'search'` with and without `description`; literal object `{ text: '1776-07-04' }` → `objectType: 'literal'`, text trimmed, empty/blank text skipped; comment as received; tags; incomplete triple skipped; unknown `type` → requested type

## 5. Generate flow and errors

- [x] 5.1 `main-layout-edit-modal-ai.handler.ts`: `requestAiPayloads` uses the new `prepareAiRequest`/`AiService`/`processLLMResponse` signatures
- [x] 5.2 Add the three codes to `AI_ERROR_CODES`; add `AI_ONTOLOGY_ERROR_CODES` whose toast uses the ontology params (open, "Select ontologies", `ontologyService.openPanel$.next()`, close)
- [x] 5.3 `ontologies-warning-toast.util.ts`: extract `getOntologiesToastParams(ontologyService)` and reuse it in `warnIfNoOntologyPredicates`; keep its spec green
- [x] 5.4 `en_US.ts`: `toast#ai_error_no_predicates`, `toast#ai_error_no_elements`, `toast#ai_error_ontology_too_large`
- [x] 5.5 `main-layout-edit-modal-ai.handler.spec.ts`: new request/response mocks (`segments`, `annotations`, `segmentMap`); the three new codes with status 422 show their message, stay open and offer "Select ontologies" that opens the panel and closes the toast; i18n keys exist; no AI-settings button on them
- [x] 5.6 `request-section.ts`: show the `semantic_annotation` option again (`editmodal#ai_type_semantic`); `request-section.spec.ts` lists the four types

## 6. Verification

- [x] 6.1 `npm test` (Jest) green
- [x] 6.2 Type-check and lint clean on touched files (`--noUnusedLocals --noUnusedParameters`, ESLint); no references left to `chunks`, `selected_text`, `contiguous_chunks`, `buildLabelUri`, `mergeContiguousToolCalls`
- [x] 6.3 Manual check in the app against a server with the new contract: highlight, comment, tags, semantic on a selection spanning paragraphs; each new error code toast
