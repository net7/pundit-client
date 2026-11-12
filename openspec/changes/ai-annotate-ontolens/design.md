## Context

Today the client sends `chunks` (non-whitespace text nodes of the selection) plus `selected_text`, and the server answers with `result` / `contiguous_chunks`: model tool calls holding only the quoted text (`chunkId` + `quote`, or start/end chunk and quote), possibly as JSON strings, in camelCase or snake_case, with a `words_counter` hint. The client locates the quotes itself (`findQuoteIndex`, `positionsSameWords`), merges calls on adjacent chunks (`annotation-llm-merge.util.ts`), and maps semantic labels to nine fixed `rdfs:` URIs (`buildLabelUri`).

The server specification has changed: every annotation now arrives with its position computed on the text the client sent (segment ids, TextQuote-like context, UTF-16 offsets), and semantic triples use elements of the user's selected ontologies, with real URIs. The old shapes are no longer served; client and server are released together.

Current flow (unchanged in structure): `onAiGenerate` → pending highlight drawn first → `prepareAiRequest` (anchor selection, `buildChunkProjection`) → `AiService.annotate` → `processLLMResponse` → `addPayloadForRange` → `renderAiPreviews`.

## Goals / Non-Goals

**Goals:**
- Send `segments` that, joined, are exactly the selection (whitespace-only nodes included, no trim).
- Place each annotation from its offsets, with a quote fallback and a safety check, without any client-side guessing of which occurrence or which chunks.
- Build the semantic content with the URIs of the response, in the same shape as a search-picked object; a literal object (date, number, measure) as a literal triple.
- Handle the three new semantic error codes, with a way to fix them.

**Non-Goals:**
- Changing the saved payload shape, the preview UI, accept/discard, or how the selection is anchored (`anchor()` + `getAnnotationSelectors`).
- Any compatibility with the old response shape.
- Escaping comments or normalizing tags on the client (the server does it).

## Decisions

### D1. Segments from `wholeTextNodesInRange`, empty nodes only skipped
`buildChunkProjection` becomes `buildSegmentProjection(range)`: it keeps every node of `wholeTextNodesInRange(range)` whose `textContent` is not `""`, ids `c1…` in order, text as-is. The map (`segmentMap: Map<string, Text>`) holds every segment, whitespace-only ones included; Map insertion order is the reading order, which D3 uses. `prepareAiRequest` no longer reads `range.toString()` (only `selected_text` used it) and returns `{ request: { segments, prompt, annotation_type }, segmentMap }`.
*Why:* the server computes offsets on exactly those strings; a trimmed or dropped node would shift offsets or break cross-segment passages.

### D2. Typed response, no normalization layer
New types in `ai-annotate-response.interface.ts`:
```ts
type AiAnnotationTarget = {
  segment: string; end_segment: string | null;
  exact: string; prefix: string; suffix: string;
  start: number | null; end: number | null;
};
type AiAnnotationElementObject = { uri: string; label: string; description?: string; elementType: ObjectUriElementType };
type AiAnnotationLiteralObject = { text: string }; // dates as YYYY-MM-DD, YYYY-MM or YYYY
type AiAnnotationTriple = {
  predicate: { uri: string; label: string };
  object: AiAnnotationElementObject | AiAnnotationLiteralObject;
};
type AiAnnotation = {
  type: AiAnnotationType; target: AiAnnotationTarget;
  comment?: string; tags?: string[]; triples?: AiAnnotationTriple[]; // all the triples of the place, in order
};
interface AiAnnotateResponse { annotations: AiAnnotation[] }
```
`AiAnnotateCall` is removed. `AiService.annotate` returns `Observable<AiAnnotation[]>`: `data.annotations` when it is an array, `[]` otherwise. `AiAnnotateChunk` becomes `AiAnnotateSegment`.
*Alternative:* keep a lenient parser for strings/variants — rejected, the contract is fixed and released together.

### D3. Placement: offsets first, quote fallback, check, skip
`processLLMResponse(annotations, segmentMap, annotationPayload, requestedType)` loops over the annotations (one `try/catch` per item, as today) and calls `locateTarget(target, segmentMap): Range | null`:
1. Resolve `startNode = map.get(segment)`, `endNode = end_segment ? map.get(end_segment) : startNode`; null if missing or `!node.isConnected`.
2. If `start` and `end` are numbers: build the Range (`setStart`/`setEnd` inside a `try`, an out-of-bounds offset throws `IndexSizeError`); if `range.toString() === exact` → done.
3. Otherwise quote anchoring (`anchorQuote`): build the joined text of the segments in map order with each segment's start offset; restrict the search window to the segments from `segment` to `end_segment`; collect every index of `exact` that starts in the start segment and ends in the end segment; score each by `prefix` matching the joined text right before it (+1 when `prefix` is non-empty and matches) and `suffix` right after it (+1); keep the highest score, the first one on equal score; map the joined offsets back to (node, offset).
4. Final check `range.toString() === exact`, else null (skip).
Context is read on the whole joined selection, so a `prefix` that reaches into the previous segment still matches.
*Why not keep `findQuoteIndex` trimming:* `exact` is the segment text verbatim, an exact match is the right test; trimming could silently move the annotation.

### D4. `addPayloadForRange(range, annotation, annotationPayload, requestedType)` returns the payload or null
It stays the single place where a payload is born: clone the pending payload, set `subject.selected = serializeRangeToSelector(range)`, then `applyAnnotationType(payload, annotation, requestedType)`, which returns `false` when the annotation lacks the content of its type (empty comment, no tags, no complete triple) so the caller skips it. Type resolution: `annotation.type` if it is one of the four request values, else the requested type. The old loose aliases (`commenting`, `linking`, `semantic annotation`…) go away.

### D5. Semantic content as a search-picked object or a literal
A semantic annotation carries in `triples` all the triples whose subject is its passage, so one place of the text gives one Linking annotation with all of them; the saved content is already an array of triples. `buildSemanticContent(triples)` returns, typed as `(SemanticTripleWithUri | SemanticTripleWithLiteral)[]`, one item per triple, in the order of `triples`:
- object with a `uri`: `{ predicate: { label, uri }, objectType: 'uri', object: { uri, label, ...(description ? { description } : {}), source: 'search', elementType } }` (`ObjectUri`);
- object with a non-empty (after trim) `text`: `{ predicate: { label, uri }, objectType: 'literal', object: { text } }`, the `SemanticTripleWithLiteral` shape the annotation server already stores for literals;
- predicate without `uri`, or object with neither: left out, the other triples are kept.
When no triple is left (or `triples` is missing or empty) it returns `undefined` and the annotation is skipped.
*Why keep the complete triples:* one bad triple from the model should not cost the user the good ones on the same passage; only an annotation with nothing to save is dropped.
`buildLabelUri` and its map are deleted.
The rest of the flow already handles literals: `getSemanticData` (`'text' in triple.object`) feeds the edit modal, `EditModalPayloadBuilder.getObjectPayload` re-saves `objectType: 'literal'`, analytics report `object-type: 'literal'` with `object-lod: null`, and the saved annotation renders `object.text`.
Note: `EditModalPayloadBuilder.getObjectPayload` drops `description` when an annotation is re-saved from the edit modal; the stored AI annotation keeps it until then. Accepted, consistent with the modal's own picks.

### D6. Removed code
`annotation-llm-merge.util.ts` (whole file), `findQuoteIndex`, `processToolCall`, `extractQuoteBounds`, `getField`, `resolveMatchRange`, `processContiguousToolCall`, `executeSingleToolCalls`, `executeContiguousToolCalls`, `positionsSameWords` (only used by the processor), `buildLabelUri`, `SEMANTIC_TYPES`, `AiAnnotateResult`, `toCallList`.

### D7. New error codes and the ontology action
`AiAnnotateErrorCode` and `AI_ERROR_CODES` gain `no_predicates`, `no_elements`, `ontology_too_large`; `en_US.ts` gains `toast#ai_error_<code>` for each (`it_IT.ts` is an empty placeholder, nothing to add). A new list `AI_ONTOLOGY_ERROR_CODES` with the three codes gets a toast that stays open with a "Select ontologies" button calling `ontologyService.openPanel$.next()` and closing the toast — the same mechanism as the semantic section's "No predicates selected" warning (`ontologies-warning-toast.util.ts`). The params builder is extracted next to it (`getOntologiesToastParams(ontologyService)`) and reused by both, with the existing `toast#ontologies_no_predicates_action` label.
*Why `ontology_too_large` too:* it is fixed in the same panel, by selecting fewer or smaller ontologies; offering the panel is the only actionable step.
*Proposed messages:*
- `no_predicates`: "Semantic AI annotations need predicates. Select an ontology for predicates in the Ontologies panel."
- `no_elements`: "Semantic AI annotations need classes or entities to link to. Select an ontology for classes or entities in the Ontologies panel."
- `ontology_too_large`: "The selected ontologies are too large for the AI model. Select fewer ontologies in the Ontologies panel and try again."

## Risks / Trade-offs

- [Server and client must ship together] → no fallback to the old shape on purpose; a mismatched deploy shows "no results" (missing `annotations`) rather than wrong highlights.
- [Page mutated between request and response (e.g. other highlights split nodes)] → nodes in the map are the ones the pending highlight already split (D4 of `ai-selection-range`); preview payloads are all built before any preview is drawn; the `exact` check plus quote fallback covers residual drift; detached nodes are skipped.
- [Prefix/suffix cited by the model with different whitespace] → only lowers the score; the first occurrence is still used, as with today's `indexOf`.
- [Ontologies panel opens in the sidebar while the AI modal is open] → same situation as the existing semantic warning toast; no extra handling.

## Migration Plan

Released together with the server. No data migration: saved payloads are unchanged. Rollback means rolling back client and server together.

## Open Questions

- Final wording of the three new toast messages (proposed in D7).
- Whether `ontology_too_large` should offer the Ontologies panel (proposed: yes) or only a message.
