## Why

Semantic annotations saved by hand can now hold triples about an ontology element (class or entity) next to the triples about the selected fragment (`semantic-element-subjects`), but annotations proposed by the AI still only state facts about the passage they sit on. Reading "Her name is Portia", the AI can say the passage identifies `Portia`, but not that `Portia lives in Belmont`, which is often the knowledge the user actually wants to record. The AI response can now carry an element subject on each triple: the client should save and show those triples exactly like the ones written in the edit modal.

## What Changes

- AI triples (`semantic_annotation` in the `/ai/annotate` response) gain an optional `subject`, with the same shape as an element object: `{ uri, label, description?, elementType: 'class' | 'entity' }`. Absent: the subject is the passage of the annotation `target`, as today. The subject is always an ontology element, never a literal nor a hand-typed URI.
- A triple with a subject (non-empty `uri`) is saved as an element-subject triple: `subjectType: 'uri'`, `subject: { uri, label, description?, source: 'search', elementType }`, the same shape as a subject picked from the element search in the edit modal. A triple without subject, or with a subject without `uri`, stays about the fragment (it is not dropped).
- Triples keep the order received: triples about the passage first, then the element-subject triples grouped by subject. These are the consecutive subject runs the annotation card and the semantic section already group into "About ‹subject›" blocks, so an AI preview card, a saved AI annotation and its edit modal look exactly like an annotation written by hand.
- One AI response can hold annotations whose passages overlap (a sentence and a word inside it, each annotated on its own), and the same element-subject triple can appear in several annotations, once for each passage it belongs to. Every such annotation is placed, previewed and saved on its own.

## Capabilities

### New Capabilities

- `ai-annotation-element-subjects`: element subjects on AI-proposed triples — response shape, saved triple shape, order, fallback to the fragment, preview/edit/save round trip, overlapping AI annotations.

### Modified Capabilities

<!-- none: AI triples without subject keep today's payload; the placement and request requirements are unchanged -->

## Impact

- Communication model: `src/communication/model/response/ai-annotate-response.interface.ts` (`AiAnnotationTriple.subject?`, doc of `AiAnnotation.triples`).
- `src/app/layouts/main-layout/handlers/annotation-llm-helpers.util.ts` (`buildSemanticTriple`, `buildSemanticContent`).
- Checked, expected unchanged: `main-layout-edit-modal-ai.handler.ts`, `edit-modal-payload.builder.ts`, `main-layout-app-events.handler.ts` (`getSemanticData`), semantic section, annotation card, anchoring of overlapping previews.
- Specs: helpers util, AI handler, payload builder; `src/testing/communication.mock.ts` only if fixtures are needed.
- Out of scope: searching or filtering annotations by subject, hand-typed URI (`free-text`) subjects from the AI.
