## Context

A `Linking` annotation is `{ subject: WebPage, content: SemanticTripleType[] }`. Every triple is `{ predicate, objectType, object }`: its subject is implicitly `annotation.subject`, the selected fragment. The semantic section of the edit modal (`semantic-section.ts`, rows built by `semantic-section.utils.ts`) edits a flat list of rows; `getSemanticData` turns stored triples into rows (keeping the stored triple in `_raw`), and `EditModalPayloadBuilder` turns rows back into triples (an unedited row is saved as its `_raw`). The annotation card (`semantic-annotation-section`) lists predicate/object pairs.

The object field already searches the classes and entities of the selected ontologies (`OntologyService.search(query, ['class', 'entity'])`) and stores a pick as `{ uri, label, source: 'search', elementType }`.

## Goals / Non-Goals

**Goals:**
- Let a triple have an ontology element (class or entity) as subject, while the annotation stays anchored to the fragment.
- Mix fragment-subject and element-subject triples in one annotation.
- Choose a subject once for several triples, and keep the stored order of the element triples.
- Leave every existing annotation and its rendering unchanged.

**Non-Goals:**
- AI-proposed annotations with element subjects.
- Search or filters on subjects.
- An explicit triple linking the fragment to the concept it names.
- Free-text or hand-typed URI subjects.

## Decisions

### D1. Extend `Linking` with an optional `subject` on the triple

```ts
export interface SemanticTripleBase {
    /** Ontology element the triple is about; absent = the annotated fragment. */
    subject?: ObjectUri | LiteralUri;   // { uri, label, description?, source: 'search', elementType } or { uri, source: 'free-text' }
    predicate: Predicate,
}
```

Absent means "the fragment", so stored annotations need no migration and the existing switches on `annotation.type` (menu, tooltip, payload, card) keep working.

Alternatives: a new annotation type (e.g. `Describing`) with full triples — clearer for consumers but it touches every switch on the type and forbids mixing the two kinds of triple in one annotation, which is required; a flag on the annotation (`mode`) — same drawbacks as a new type, plus a special case. An explicit `{ type: 'fragment' }` subject was dropped: readers must handle triples without `subject` anyway.

`subject` reuses the object URI shapes: an element picked from the search (`ObjectUri`, `source: 'search'`) or a URI typed by hand (`LiteralUri`, `source: 'free-text'`), so labels, badges and links are rendered with the same helpers as objects. A subject is never a literal: RDF does not allow it.

### D2. Relations about the selection as before, subject blocks on request

```
Semantic relations
predicate │ object │ ⋮                       ← relations about the selection: unchanged
[+ Add relations about an entity or class]   ← the only addition

after a click:
predicate │ object │ ⋮
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
About [Search an entity or class, or type a URI ▾]          ← same rows, about an ontology element
predicate │ object │ ⋮
[+ Add relations about an entity or class]
```

The relations about the selection change as little as possible: same title, same rows, no label, no subject shown. The only addition is one button whose text says what it does; it follows the last block. Each subject block repeats the same rows under an "About ‹subject›" line, so it reads as the same relations with another subject. Nothing is shown until the user asks for it: no labels, no tooltips, no empty block. The purpose is never named in the UI (it is derived from the subject, as in the data: a triple without `subject` links the selection, a triple with `subject` describes that element).

The last row about the selection is cleared, not removed, as before; an subject block goes away with its last row (no other remove action).

Each subject block shows the subject in bold on top and its rows hanging from it on a continuous vertical line; the card draws them the same way, so the user reads every block as triples of their own. There is no box: a single line sets the first block apart from the relations about the selection (in the card, from the grey object of the last one: the subject is a bold title on white), and only space separates the blocks from each other. Boxes around every block were tried and dropped (too many lines).

Saving needs no new rule: the section value holds only complete triples (rows with predicate and object, in a block with a subject), so the edit modal's `required` check enables Save as soon as one block is complete; incomplete rows and blocks without subject are dropped.

Alternatives tried and dropped, all judged too complex or unclear in the modal:
- a "Selection" option in every subject field (it had to be choosable once and mixed two kinds of options);
- two parts titled "Semantic relations" / "Other relations" (it read as two kinds of relations);
- a "Selected text" header and box on the selection block (it changed the linking form);
- a menu, an external link and a remove action on each subject line (too many buttons);
- "Linking relations" / "Describing relations" labels with tooltips and an empty subject block always shown (W3C terms users do not use, twice the modal for the common linking case);
- the subject as a first column of every row (clean model, but it changes the linking rows and narrows every column).

Model: the section keeps its flat `rows` (every row handler still works by row index) and each row gets a `groupId`; `groups` holds the subject state (`SemanticSubjectGroup`: `isFragment`, `picked`, search state, `storedKey` = subject key it was loaded with). The value is built block after block (`getGroupsValue`), selection first. The element subject field is a presentational child component (`pnd-semantic-subject-field`) wired with the `emit` input pattern, the state staying in the section; the row markup is one `ng-template` used by every block.

Element blocks = runs of consecutive triples with the same element subject. Loading puts the triples without subject among the relations about the selection, then walks the triples with a subject in stored order and starts a new block whenever the subject changes. The same element can appear in several blocks (no uniqueness: the user may write the same triples more than once).

```
stored:  D·P1  F·P2  D·P3  B·P4  D·P5           shown:  (selection) P2
                                                       D: P1 P3 │ B: P4 │ D: P5
saved:   F·P2  D·P1  D·P3  B·P4  D·P5
```

Saving writes the selection triples first, then the blocks in display order. The order of the element triples is kept; triples about the selection interleaved with element triples (not producible from this form) move to the top.

### D3. Subject field

Same combobox look as the predicate, on the subject line of an element block:
- Typing ≥ 1 character searches `['class', 'entity']` with the debounce and stale-answer guard already used by the object search (the latest query wins); options show label, source label with external link and ENTITY/CLASS badge; the picked subject shows its badge.
- A typed URI (text starting with a URI scheme, the same test as the object) is accepted: "Use “…” as URI" option, Enter, or leaving the field; it is saved as `{ uri, source: 'free-text' }` and shown with the URI badge.
- Any other free text is refused: leaving the field restores the previous subject.
- Changing the subject applies to all triples of the block.
- When no ontology is used for classes or entities, the list shows a hint to select ontologies; the existing warning toast is not changed.

"Add relations about an entity or class" (a quiet full-width row after the last block: plus icon + text, dashed border like the block separators, link colour on hover — not a `pnd-btn`, which weighs as much as Save/Cancel) appends a block with no subject and one empty row, focus on the subject field. Its triples are not saved until a subject is picked, like a row without a predicate.

### D4. Saving: `_raw` with the group's subject

Each row value gets the subject of its group. `EditModalPayloadBuilder.getSemanticContentRow`:
- edited row → built as today, then `subject` added when the group subject is an element;
- unedited row (`_raw`) → `_raw` saved as stored when the group subject key equals the key it was loaded with; otherwise `_raw` with `subject` replaced. This also keeps read-only date rows saveable when their group changes subject.

Rows of a group without a chosen subject return `null` and are dropped.

`getSemanticData` returns, for each triple, the row data plus `subject` (copy of `{ uri, label, description?, elementType }` with `source: 'search'`), and the section builds the groups from it.

### D5. Annotation card

`transformData` groups the triples with the same consecutive-run rule and returns `{ groups: [{ subject?, triples }] }`. A group with a subject is headed "About ‹label›", the label in bold on white (label linking to its URI in a new tab, URI as `title`; no type badge, the sidebar is narrow and the link already says where it leads), its triples hanging from it on a vertical line; one line before the first such group, space between the others. Groups without subject have no header (identical to today); since the form saves them first, they read as the relations about the selection. Triples inside a group render as today, except the predicate: its label now links to the predicate URI (new tab, URI as `title`), for every triple, those about the selection included; the subject label and the element objects already linked to theirs. Long texts stay in the card: subject and predicate labels are cut with an ellipsis, long URIs and literals wrap.

## Risks / Trade-offs

- [Consumers of stored annotations that ignore `subject` read element-subject triples as facts about the fragment] → `subject` is always written explicitly for element subjects; readers of this repo (card, edit modal) are updated in this change.
- [The section template grows (group line + rows) on an already large component] → the group logic (load/flatten/keys/value) lives in `semantic-section.utils.ts` as pure functions with specs; the component keeps only event wiring.
- [The same subject can appear in two groups, which may look redundant] → accepted (no uniqueness rule); reopening merges groups that became adjacent.
- [Relations about the selection interleaved with element triples are reordered on save] → such annotations cannot be made from this form; stored annotations without subjects are unaffected.
- [A group without subject silently drops its triples on save] → same rule as a row without predicate; the subject field shows its placeholder and stays focused when the group is created.
