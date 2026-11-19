## 1. Model

- [x] 1.1 Add `AiAnnotateContext` and `AiAnnotateRequest.context?` to `src/communication/model/request/ai-annotate-request.interface.ts`, with JSDoc (used only to understand the selection; empty fields left out)

## 2. Utilities

- [x] 2.1 `ai-page-context.util.ts`: `getPageMetadata(doc)` with the Open Graph / meta / `document.title` / host name fallbacks (design D2)
- [x] 2.2 `getTextAround(first, last, root)`: TreeWalker on text nodes, skipping script/style/noscript/template/`pnd-root`, whitespace collapsed, nodes joined as they are, 1,500-character cut on a space (design D3, D4)
- [x] 2.3 `buildPageContext(first?, last?)`: metadata + text around, empty fields left out, `undefined` when empty

## 3. Request

- [x] 3.1 `prepareAiRequest` adds `context` (from the first and last segment nodes) for every annotation type; no key when undefined

## 4. Specs

- [x] 4.1 Metadata: Open Graph first, fallbacks, blank meta, empty fields left out
- [x] 4.2 Text around: 1,500 limit without split words, long word cut at the character, script/style/`pnd-root` skipped, highlights read as text, words split by formatting kept whole, no added spaces, selection at document start/end, no DOM text
- [x] 4.3 `prepareAiRequest`: request with `context`, segments unchanged, no `context` when empty

## 5. Verification

- [x] 5.1 `npm test`, lint on touched files, `tsc --noEmit`; `npx openspec validate ai-page-context`
