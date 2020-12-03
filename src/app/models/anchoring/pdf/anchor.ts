import { anchorByPosition } from './anchorByPosition';
import { findInPages } from './findInPages';
import { findPage } from './findPageOffset';
import { prioritizePages } from './prioritizePages';

/**
 * Anchor a set of selectors to a DOM Range.
 *
 * @param {HTMLElement} root
 * @param {Selector[]} selectors - Selector objects to anchor
 * @return {Promise<Range>}
 */
export function anchor(root, selectors) {
  const position = /** @type {TextPositionSelector|undefined} */ (selectors.find(
    (s) => s.type === 'TextPositionSelector'
  ));
  const quote = /** @type {TextQuoteSelector|undefined} */ (selectors.find(
    (s) => s.type === 'TextQuoteSelector'
  ));

  /** @type {Promise<Range>} */
  let result: Promise<any> = Promise.reject(new Error('unable to anchor'));

  const checkQuote = (range) => {
    if (quote && quote.exact !== range.toString()) {
      throw new Error('quote mismatch');
    }
    return range;
  };

  if (position) {
    result = result.catch(() => findPage(position.start).then(({ index, offset, textContent }) => {
      const start = position.start - offset;
      const end = position.end - offset;
      const length = end - start;

      checkQuote(textContent.substr(start, length));

      return anchorByPosition(index, start, end);
    }));
  }

  if (quote) {
    result = result.catch(() => {
      if (
        position
        && quotePositionCache[quote.exact]
        && quotePositionCache[quote.exact][position.start]
      ) {
        const { pageIndex, anchor } = quotePositionCache[quote.exact][
          position.start
        ];
        return anchorByPosition(pageIndex, anchor.start, anchor.end);
      }

      return prioritizePages(position?.start ?? 0).then((pageIndices) => findInPages(pageIndices, quote, position));
    });
  }

  return result;
}
