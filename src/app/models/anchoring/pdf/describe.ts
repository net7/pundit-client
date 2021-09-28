import { TextQuoteAnchor } from '../anchors';
import { getNodeTextLayer } from './getNodeTextLayer';
import { getPageOffset } from './getPageOffset';
import { getSiblingIndex } from './getSiblingIndex';
import { SelectorWithType, TextPositionSelectorWithType } from '../types';
import { TextPosition, TextRange } from '../text-range';

/**
 * Convert a DOM Range object into a set of selectors.
 *
 * Converts a DOM `Range` object into a `[position, quote]` tuple of selectors
 * which can be saved with an annotation and later passed to `anchor` to
 * convert the selectors back to a `Range`.
 *
 * @param {HTMLElement} root - The root element
 * @param {Range} range
 * @return {Promise<Selector[]>}
 */
export async function describe(root: HTMLElement, range: Range): Promise<SelectorWithType[]> {
  let currentRange;
  // "Shrink" the range so that the start and endpoints are at offsets within
  // text nodes rather than any containing nodes.
  try {
    currentRange = TextRange.fromRange(range).toRange();
  } catch {
    throw new Error('Selection does not contain text');
  }

  const startTextLayer = getNodeTextLayer(currentRange.startContainer);
  const endTextLayer = getNodeTextLayer(currentRange.endContainer);

  if (!startTextLayer || !endTextLayer) {
    throw new Error('Selection is outside page text');
  }

  if (startTextLayer !== endTextLayer) {
    throw new Error('Selecting across page breaks is not supported');
  }

  const startPos = TextPosition.fromPoint(
    currentRange.startContainer,
    currentRange.startOffset
  ).relativeTo(startTextLayer);

  const endPos = TextPosition.fromPoint(
    currentRange.endContainer,
    currentRange.endOffset
  ).relativeTo(endTextLayer);

  const startPageIndex = getSiblingIndex(
    startTextLayer.parentNode
  );
  const pageOffset = await getPageOffset(startPageIndex);

  const position: TextPositionSelectorWithType = {
    type: 'TextPositionSelector',
    start: pageOffset + startPos.offset,
    end: pageOffset + endPos.offset,
  };

  const quote = TextQuoteAnchor.fromRange(root, currentRange).toSelector();

  return [position, quote];
}
