import { TextQuoteAnchor } from '../anchors';
import { anchorByPosition } from './anchorByPosition';
import { getPageTextContent } from './getPageContext';
import { getPageOffset } from './getPageOffset';

/**
 * A cache that maps a `(quote, text offset in document)` key to a specific
 * location in the document.
 *
 * The components of the key come from an annotation's selectors. This is used
 * to speed up re-anchoring an annotation that was previously anchored in the
 * current session.
 *
 * @type {Object<string, Object<number, PdfTextRange>>}
 */
const quotePositionCache = {};

/**
 * Search for a quote in the given pages.
 *
 * @param {number[]} pageIndexes - Pages to search in priority order
 * @param {TextQuoteSelector} quoteSelector
 * @param {Object} positionHint - Options to pass to `TextQuoteAnchor#toPositionAnchor`
 * @return {Promise<Range>} Location of quote
 */
export function findInPages(pageIndexes, quoteSelector, positionHint) {
  if (pageIndexes.length === 0) {
    // We reached the end of the document without finding a match for the quote.
    return Promise.reject(new Error('Quote not found'));
  }

  const [pageIndex, ...rest] = pageIndexes;

  const content = getPageTextContent(pageIndex);
  const offset = getPageOffset(pageIndex);

  const attempt = ([cnt, offst]) => {
    const root = document.createElement('div');
    root.textContent = cnt;
    const anchor = TextQuoteAnchor.fromSelector(root, quoteSelector);
    if (positionHint) {
      let hint = positionHint.start - offst;
      hint = Math.max(0, hint);
      hint = Math.min(hint, cnt.length);
      return anchor.toPositionAnchor({ hint });
    }
    return anchor.toPositionAnchor();
  };

  const next = () => findInPages(rest, quoteSelector, positionHint);

  const cacheAndFinish = (anchor) => {
    if (positionHint) {
      if (!quotePositionCache[quoteSelector.exact]) {
        quotePositionCache[quoteSelector.exact] = {};
      }
      quotePositionCache[quoteSelector.exact][positionHint.start] = {
        pageIndex,
        anchor,
      };
    }
    return anchorByPosition(pageIndex, anchor.start, anchor.end);
  };

  // First, get the text offset and other details of the current page.
  return (
    Promise.all([content, offset])
      // Attempt to locate the quote in the current page.
      .then(attempt)
      // If the quote is located, find the DOM range and return it.
      .then(cacheAndFinish)
      // If the quote was not found, try the next page.
      .catch(next)
  );
}
