## 1. Selectors

- [x] 1.1 `getAnnotationSelectors(selected)` in `src/app/models/annotation/annotation-selectors.ts`; `AnchorService.createSelectors` uses it

## 2. Request

- [x] 2.1 `buildChunkProjection` on `wholeTextNodesInRange`
- [x] 2.2 `prepareAiRequest` async, anchoring with `anchor()`; null when anchoring fails
- [x] 2.3 Remove the XPath/text-quote restore; move `positionsSameWords` to the utils
- [x] 2.4 `onAiGenerate`: await the pending highlight, await `prepareAiRequest`

## 3. Tests

- [x] 3.1 Chunks: selection inside formatting, across formatting, across paragraphs (jsdom, selectors from `describe()`)
- [x] 3.2 Unanchorable selectors give no request
- [x] 3.3 Handler: pending highlight awaited before the request

## 4. Verification

- [x] 4.1 `npm test`, `npm run lint` and type-check green
