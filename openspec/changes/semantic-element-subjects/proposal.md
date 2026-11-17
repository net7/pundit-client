## Why

A semantic annotation today states facts about the selected passage only: every triple has the fragment as its implicit subject. Often the passage names a concept (the word "Dante") and what the user wants to record is knowledge about that concept or around it — `Dante Alighieri bornIn Florence`, `Beatrice lovedBy Dante Alighieri` — where the subject is an element of the user's ontologies, not the text. The fragment stays the anchor of these triples (it is what they are "about"), without being their subject.

## What Changes

- A triple of a `Linking` annotation gains an optional `subject`: an ontology element (class or entity) with the same shape as an object picked from the element search (`{ uri, label, description?, source: 'search', elementType }`), or a hand-typed URI with the same shape as a typed URI object (`{ uri, source: 'free-text' }`). A subject is never a literal. A triple without `subject` keeps meaning "the selected fragment is the subject", so every annotation already saved is unchanged and still valid.
- One annotation can mix triples whose subject is the fragment and triples whose subject is an element, and triples with different element subjects.
- The relation between the fragment and the element subjects stays implicit: no triple is added to link them.
- Semantic section of the edit modal: the relations about the selection stay **as before** (same title, same rows, no label). Below them a single button, **"Add relations about an entity or class"**, adds a block of the same rows headed **"About ‹subject›"**, the subject picked with an autocomplete over the classes and entities of the selected ontologies (label, source label with external link, ENTITY/CLASS badge) or typed as a URI ("Use … as URI", Enter or leaving the field); other free text is not accepted. Each subject block shows its subject on top and its rows hanging from it on a vertical line, so its triples read apart from the others; one line separates the first block from the relations about the selection, only space the blocks from each other. The button follows the last block. An subject block is a run of consecutive triples with the same element subject; the subject applies to all its triples.
- No subject block is shown until the user asks for one. A block goes away with its last row. The same element can be the subject of several blocks.
- Saving is possible when at least one block holds a complete triple; incomplete rows and blocks without subject are not saved.
- Saved order: the relations about the selection first, then the groups in the order shown; reopening shows the element triples in their stored order.
- Rows inside a group keep today's behaviour: predicate autocomplete, object as element, literal, free-text URI; date rows stay read-only. A row the user did not edit is saved as stored, with the subject of its group.
- Annotation card: the triples are shown in the same subject groups; each subject heads its own block, "About ‹label›" (label linking to its URI, no type badge) with its triples hanging from it on a vertical line; the relations about the selection have no header, as today.
- Annotation card: the predicate label of every triple links to the predicate URI (new tab), as the subject and the element objects already do.
- A comment typed with triples is still discarded, as today.

## Capabilities

### New Capabilities
- `semantic-element-subjects`: triples whose subject is an ontology element — stored shape, subject groups in the semantic section (picking, adding, removing, order), saving and reopening, display in the annotation card.

### Modified Capabilities
<!-- none: the shape of existing triples and every existing requirement are unchanged -->

## Impact

- Communication model: `src/communication/model/entity/triple.ts` (`SemanticTripleBase.subject?`), `src/testing/communication.mock.ts` fixtures.
- Edit modal: `semantic-section.ts/html`, `semantic-section.utils.ts` (group model, subject search, group value), `edit-modal-payload.builder.ts` (subject on saved triples), `main-layout-app-events.handler.ts` (`getSemanticData` carries the subject).
- Annotation card: `semantic-annotation-section.ts/html`.
- Styles `_edit-modal.scss`, `_annotation.scss`; i18n `en_US.ts`; Jest specs for utils, section, payload builder, `getSemanticData`, card section.
- Out of scope: AI-proposed annotations (`/ai/annotate` keeps producing triples without subject), searching or filtering annotations by subject.
