import { TextQuoteAnchor } from '../anchors';
import { TextPosition, TextRange } from './text-range';
import { getNodeTextLayer } from './getNodeTextLayer';
import { getPageOffset } from './getPageOffset';
import { getSiblingIndex } from './getSiblingIndex';

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
export async function describe(root, range) {
  // "Shrink" the range so that the start and endpoints are at offsets within
  // text nodes rather than any containing nodes.
  try {
    // eslint-disable-next-line no-param-reassign
    range = TextRange.fromRange(range).toRange();
  } catch {
    throw new Error('Selection does not contain text');
  }

  const startTextLayer = getNodeTextLayer(range.startContainer);
  const endTextLayer = getNodeTextLayer(range.endContainer);

  if (!startTextLayer || !endTextLayer) {
    throw new Error('Selection is outside page text');
  }

  if (startTextLayer !== endTextLayer) {
    throw new Error('Selecting across page breaks is not supported');
  }

  const startPos = TextPosition.fromPoint(
    range.startContainer,
    range.startOffset
  ).relativeTo(startTextLayer);

  const endPos = TextPosition.fromPoint(
    range.endContainer,
    range.endOffset
  ).relativeTo(endTextLayer);

  const startPageIndex = getSiblingIndex(
    /** @type {Node} */(startTextLayer.parentNode)
  );
  const pageOffset = await getPageOffset(startPageIndex);

  /** @type {TextPositionSelector} */
  const position = {
    type: 'TextPositionSelector',
    start: pageOffset + startPos.offset,
    end: pageOffset + endPos.offset,
  };

  const quote = TextQuoteAnchor.fromRange(root, range).toSelector();

  return [position, quote];
}
