## Why

The text sent to the AI is not always the text the user selected. The request restores the selection with its own XPath code, which applies `@net7/annotator`'s element-relative offsets to the element's first text node: a selection that starts or ends inside an element with inline formatting (`Comune di <em>Viterbo</em> si trova…`) sends the model only the text before it. It also sends the text nodes at the selection's boundaries whole, so text outside the selection reaches the model and can be annotated.

## What Changes

- The selection of the pending annotation is restored with `anchor()` from `@net7/annotator`, from the same selectors used to highlight it (range, text position, text quote), instead of the hand-written XPath and text-quote restore.
- The chunks sent to the AI are the text nodes inside the selection, split at its boundaries, taken with `wholeTextNodesInRange()` from `@net7/annotator`: the text sent is exactly the selection.
- The pending highlight is drawn before the request is built, so both work on the same, already split, text nodes.

## Capabilities

### New Capabilities

- `ai-annotate-selection`: which text of the page the AI annotation request carries.

### Modified Capabilities

None.

## Impact

- Affected code: `annotation-range-selector.util.ts` (`prepareAiRequest` becomes async and anchors the selection), `annotation-range-utils.ts` (`buildChunkProjection` on `wholeTextNodesInRange`), `annotation-range-restore.ts` (XPath and text-quote restore removed; `positionsSameWords` moves to the utils), `anchor.service.ts` (selector building shared), `main-layout-edit-modal-ai.handler.ts` (waits for the pending highlight), specs.
- Server: none.
