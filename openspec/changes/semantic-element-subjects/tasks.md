## 1. Baseline

- [x] 1.1 On `feature/semantic-element-subjects` (from `develop`) record a green baseline: `tsc --noEmit` on the tsconfig projects, `npm run lint`, `npm test`, `npm run build:chrome-ext-stage` (branch created from a clean `develop`; checks run on the result, see 7.1)

## 2. Model

- [x] 2.1 Add `subject?: ObjectUri | LiteralUri` (element or typed URI) to `SemanticTripleBase` in `src/communication/model/entity/triple.ts` (doc comment: absent = the annotated fragment)
- [x] 2.2 ~~Add a `Linking` fixture to `src/testing/communication.mock.ts`~~ — the mock holds no annotation fixtures; the specs build their own triples

## 3. Group logic (pure, in `semantic-section.utils.ts`)

- [x] 3.1 Add `SemanticSubjectGroup` type and `getSubjectKey` (`'fragment'` or element URI)
- [x] 3.2 Add `toSubjectRuns(subjects)`: consecutive-run grouping keeping stored order; `storedKey` per group
- [x] 3.3 Add `getGroupsValue(groups)`: flattened row values in display order with the group subject; groups without subject dropped
- [x] 3.4 Specs: interleaved `S1 S1 S2 S1` → 3 groups, round trip order, group without subject dropped, all-fragment → one "Selection" group

## 4. Reopen and save

- [x] 4.1 `getSemanticData` copies `subject` (`uri`, `label`, `description?`, `elementType`, `source: 'search'`) into each row data
- [x] 4.2 `EditModalPayloadBuilder`: add `subject` to edited rows of element groups; `_raw` saved as stored when the group key is unchanged, otherwise with `subject` replaced or removed (design D4)
- [x] 4.3 Specs: `getSemanticData` with/without subject, typed URI subject; payload builder (edited row with element subject, typed URI subject, fragment row without `subject`, unedited row, unedited row after subject change, date row after subject change)
- [x] 4.4 `subjectType` on every saved triple (`'uri'` with `subject`, `'target'` without), replaced together with `subject` on unedited rows that changed group; specs for both moves

## 5. Semantic section UI

- [x] 5.1 Add `groups` next to the flat `rows` (each row has a `groupId`, rows of a group contiguous) in `semantic-section.ts`; build them from the input value; fixed selection group first (no subject field, never removed), then the element groups
- [x] 5.2 Subject combobox: `['class', 'entity']` search with debounce and latest-query guard (reuse the object search stream keyed by group), no free text, Escape/blur restore, external link, badge, hint when no class/entity ontology
- [x] 5.3 "Add relations about an entity or class" button after the last block (new subject block, focus subject field); last-row removal removes an subject block and clears the last row about the selection; no menu, link or remove action on the subject line
- [x] 5.4 Row add/remove/edit scoped to their group; existing row behaviour unchanged
- [x] 5.5 Template and `_edit-modal.scss`: rows about the selection as before (no label), subject blocks below (dashed separator, subject field, same rows; one `ng-template` for the row markup), add button after the last block; the subject field is the presentational `pnd-semantic-subject-field` (`subject-field/`), wired with the `emit` input pattern, state kept in the section
- [x] 5.6 i18n `en_US.ts`: `editmodal#semantic_subject_label`, `editmodal#semantic_subject_placeholder`, `editmodal#semantic_subject_hint`, `editmodal#semantic_subject_no_results`, `editmodal#semantic_subject_no_ontologies`, `editmodal#semantic_subject_add`, `annotation#semantic_subject_about`
- [x] 5.7 Specs: subject search (stale answers discarded), typed URI accepted (Enter, blur), other free text refused, change subject applies to all rows, no subject block on a new annotation, only complete block emitted, add block, block removed with its last row, last relation about the selection cleared, not removed, selection relations saved first, value emitted in order

## 6. Annotation card

- [x] 6.1 `semantic-annotation-section.ts`: group triples by consecutive subject, `{ groups: [{ subject?, triples }] }`
- [x] 6.2 Template and `_annotation.scss`: one block per subject (no box; one line before the first, space between the others), header "About ‹label›" (label link, no type badge; long labels cut, long URIs wrap), triples on a vertical line; no header for triples without subject
- [x] 6.3 Specs: predicate URI kept, fragment-only unchanged, mixed groups, interleaved order
- [x] 6.4 Predicate label linked to the predicate URI in the card (all triples), `title` with the URI

## 7. Verification

- [ ] 7.1 `tsc --noEmit` (app, spec, chrome-ext), `npm run lint`, `npm test` (292), `build:embed-stage` green; `npm run build:chrome-ext-stage` still to run (killed for memory on the dev machine)
- [ ] 7.2 Manual check in the embed build: new annotation with relations about the selection and subject blocks, only subject blocks, typed URI subject, reopen interleaved annotation, change subject of a group with a date row, legacy annotation unchanged
