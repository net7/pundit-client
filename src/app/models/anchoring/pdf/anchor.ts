import { SelectorWithType, TextPositionSelectorWithType, TextQuoteSelectorWithType } from '../types';
import { anchorByPosition } from './anchorByPosition';
import { anchorQuote } from './anchorQuote';
import { findPageByOffset } from './findPageByOffset';
import { quotePositionCacheKey } from './quotePositionCacheKey';
import { quotePositionCache } from './state';

/**
 * Anchor a set of selectors to a DOM Range.
 *
 * `selectors` must include a `TextQuoteSelector` and may include other selector
 * types.
 *
 * @param {HTMLElement} root
 * @param {Selector[]} selectors
 * @return {Promise<Range>}
 */
export async function anchor(root: HTMLElement, selectors: SelectorWithType[]) {
  const quote = (
    selectors.find((s) => s.type === 'TextQuoteSelector')
  ) as TextQuoteSelectorWithType;

  // The quote selector is required in order to check that text position
  // selector results are still valid.
  if (!quote) {
    throw new Error('No quote selector found');
  }

  const position = (
    selectors.find((s) => s.type === 'TextPositionSelector')
  ) as TextPositionSelectorWithType;

  if (position) {
    // If we have a position selector, try using that first as it is the fastest
    // anchoring method.
    try {
      const { index, offset, text } = await findPageByOffset(position.start);
      const start = position.start - offset;
      const end = position.end - offset;
      const length = end - start;

      const matchedText = text.substr(start, length);
      if (quote.exact !== matchedText) {
        throw new Error('quote mismatch');
      }

      const range = await anchorByPosition(index, start, end);
      return range;
    } catch {
      // Fall back to quote selector
    }

    // If anchoring with the position failed, check for a cached quote-based
    // match using the quote + position as a cache key.
    try {
      const cacheKey = quotePositionCacheKey(quote.exact, position.start);
      const cachedPos = quotePositionCache.get(cacheKey);
      if (cachedPos) {
        const { pageIndex, anchor: cachedAnchor } = cachedPos;
        const range = await anchorByPosition(
          pageIndex,
          cachedAnchor.start,
          cachedAnchor.end
        );
        return range;
      }
    } catch {
      // Fall back to uncached quote selector match
    }
  }

  return anchorQuote(quote, position?.start);
}
