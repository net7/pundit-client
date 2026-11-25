## Context

`POST /ai/annotate` returns one annotation per passage. For `semantic_annotation`, `annotation-llm-helpers.util.ts` turns `triples` into the content of a `Linking` payload (`buildSemanticContent`): an element object becomes `{ predicate, objectType: 'uri', object: { uri, label, description?, source: 'search', elementType } }`, a literal `{ predicate, objectType: 'literal', object: { text } }`; incomplete triples are left out. The payloads become preview cards (`MainLayoutEditModalAiHandler.renderAiPreviews`) and are saved as they are on "Save all" (`onAiAccept`). Previews have no menu: they are not edited before being saved; a saved AI annotation is edited like any other one (`getSemanticData` → semantic section → `EditModalPayloadBuilder`).

`semantic-element-subjects` added `subjectType` / `subject` to `SemanticTripleBase`, grouping into consecutive subject runs (`toSubjectRuns`) in the annotation card and in the semantic section, and the save rules of the edit modal. All of that reads `triple.subject` and works on any `Linking` content, wherever it comes from.

## Goals / Non-Goals

**Goals:**
- Save AI triples with an element subject in the very shape the edit modal saves a subject picked from the element search.
- Keep AI triples without subject, and stored annotations, unchanged.
- Keep the order received, so preview, card and edit modal show the same "About ‹subject›" blocks as a hand-written annotation.
- Make sure overlapping AI annotations are each placed, highlighted and opened.

**Non-Goals:**
- Searching or filtering annotations by subject.
- Hand-typed URI (`free-text`) subjects proposed by the AI.
- Changing how highlights are drawn or how clicks on nested highlights are dispatched (see D4).

## Decisions

### D1. `subject` on `AiAnnotationTriple` reuses the element object type

```ts
export type AiAnnotationTriple = {
  /** Ontology element the triple is about; absent = the passage of `target`. */
  subject?: AiAnnotationElementObject;
  predicate: { uri: string; label: string };
  object: AiAnnotationElementObject | AiAnnotationLiteralObject;
};
```

The subject is always an element of the user's ontologies, never a literal (RDF does not allow it) nor a free URI, so it shares `AiAnnotationElementObject` with the object: one shape for labels, descriptions and badges. No `source` comes with it: the client adds `source: 'search'` when saving, as it does for the object. Alternative: a separate `AiAnnotationSubject` type — dropped, it would be a copy of the element object.

### D2. Building the triple: subject first, then the object as today

`buildSemanticTriple` builds the predicate/object triple exactly as today, then, when `subject.uri` is a non-empty string, prepends:

```ts
{ subjectType: 'uri', subject: { uri, label, description?, source: 'search', elementType } }
```

`description` only when present (same rule as the object). Same keys and order as `EditModalPayloadBuilder.getSubjectPayload` for a searched subject, so an AI triple and a hand-written one are indistinguishable once saved.

A subject without `uri` (missing, empty, or not an object) falls back to the fragment: the triple is kept, without `subject` and `subjectType`, like today's AI triples. Dropping it would lose a valid predicate/object pair because of a malformed extra field; keeping it as a fragment triple is what the response means when there is no subject.

Fragment triples get no `subjectType` key: AI content stays byte-for-byte what it is today for responses without subjects, and an absent `subjectType` already means "the fragment" (`semantic-element-subjects` D1). Alternative: always write `subjectType: 'target'` — dropped, it changes every existing AI payload for no reader's benefit.

### D3. Order is kept, not rebuilt

The response already lists the triples about the passage first, then the element-subject triples grouped by subject, in the order subjects appear. `buildSemanticContent` maps and filters, it never sorts: the consecutive runs received are the "About ‹subject›" blocks shown. A response that interleaved subjects would still be shown correctly (one block per run, same as a stored annotation) and the edit modal would regroup it on save as it does for any stored annotation. Alternative: sort by subject on the client — dropped, it would hide the model's order and duplicate the grouping the card already does.

### D4. Preview, edit and save need no new code

- Preview card: `getAnnotationFromPayload` copies `content` as is; the card's `transformData` groups by subject run.
- Save all: the payload is posted as built (D2), so subjects reach the server unchanged.
- Edit after saving: `getSemanticData` copies `subject` into each row, the semantic section builds its blocks from it, and `EditModalPayloadBuilder` keeps `_raw` (subject included) for unedited rows.

This change only adds specs proving the round trip with a mixed annotation (fragment triples + two element subjects).

Overlapping annotations (a sentence and a word inside it) are already independent previews: `processLLMResponse` computes every selector before any preview is drawn, then each preview is anchored on its own and gets its own highlight elements. Highlights nest; a click on the inner one bubbles to the outer one. This is checked in the page; if a nested highlight is not drawn or cannot be opened, it is reported before touching anchoring, which is shared with every saved annotation.

## Risks / Trade-offs

- [The same element-subject triple saved in several annotations reads as duplicated in the sidebar] → intended: each annotation records the triple next to the passage it was read from; the user can delete either.
- [A malformed subject silently turns a triple into a fragment triple] → only when `uri` is missing or empty; such a triple is still a valid statement about the passage, and the predicate/object pair is not lost.
- [Nested highlights dispatch two clicks (inner, then outer)] → existing behaviour of overlapping annotations; verified in page, not changed here.
