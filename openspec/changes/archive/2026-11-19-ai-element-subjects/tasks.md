## 1. Baseline

- [x] 1.1 On `feature/ai-element-subjects` (from `develop`) record a green baseline: `npm test` and lint on the touched files

## 2. Model

- [x] 2.1 Add `subject?: AiAnnotationElementObject` to `AiAnnotationTriple` in `src/communication/model/response/ai-annotate-response.interface.ts`, with a doc comment (absent = the passage of `target`)
- [x] 2.2 Update the doc of `AiAnnotation.triples`: triples about the passage first, then element-subject triples grouped by subject, in the order received

## 3. Triple building

- [x] 3.1 `annotation-llm-helpers.util.ts`: a subject with a non-empty `uri` adds `subjectType: 'uri'` and `subject: { uri, label, description?, source: 'search', elementType }` to the built triple (design D2)
- [x] 3.2 Subject without `uri` (missing, empty, not an object) → triple kept about the fragment, no `subject`/`subjectType`
- [x] 3.3 Order received kept; update the doc comments of `buildSemanticTriple` / `buildSemanticContent`

## 4. Specs

- [x] 4.1 Helpers util spec: triple with subject (with and without description), literal object with subject, subject without `uri`, triple without subject unchanged, incomplete triple with subject left out, mixed order kept
- [x] 4.2 `processLLMResponse`: two overlapping semantic annotations (sentence + word) both placed, same subject triple in both payloads
- [x] 4.3 AI handler spec: mixed annotation previewed and saved by "Save all" with subjects
- [x] 4.4 Payload builder / `getSemanticData` round trip of a mixed AI annotation: reopened rows carry the subjects, unedited save equals stored content
- [x] 4.5 ~~`src/testing/communication.mock.ts` fixtures~~ — not needed: specs build their own triples

## 5. Verification

- [x] 5.1 Check that preview card and edit modal show "About ‹subject›" blocks for a mixed AI annotation (card grouping and semantic section reuse; no code change expected)
- [x] 5.2 Check in the page that two overlapping AI previews (sentence + word) are both highlighted and both open; report before changing highlighting if not
- [x] 5.3 `npm test`, lint, `tsc --noEmit`; `npx openspec validate ai-element-subjects`
