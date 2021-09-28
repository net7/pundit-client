/* eslint-disable no-restricted-syntax */
import { TextQuoteSelector } from '@pundit/anchoring';
import { anchorByPosition } from './anchorByPosition';
import { findPageByOffset } from './findPageByOffset';
import { getPageTextContent } from './getPageTextContent';
import { getPdfViewer } from './getPdfViewer';
import { matchQuote } from './match-quote';
import { quotePositionCacheKey } from './quotePositionCacheKey';
import { quotePositionCache } from './state';
import { stripSpaces } from './stripSpaces';

/**
 * Search for a quote in the given pages.
 *
 * When comparing quote selectors to document text, ASCII whitespace characters
 * are ignored. This is because text extracted from a PDF by different PDF
 * viewers, including different versions of PDF.js, can often differ in the
 * whitespace between characters and words. For a long time PDF.js in particular
 * had issues where it would often produce extra spaces between characters that
 * should not be there or omit spaces between words.
 *
 * @param {TextQuoteSelector} quoteSelector
 * @param {number} [positionHint] - Expected start offset of quote
 * @return {Promise<Range>} Location of quote
 */
export async function anchorQuote(
  quoteSelector: TextQuoteSelector, positionHint: number
): Promise<Range> {
  // Determine which pages to search and in what order. If we have a position
  // hint we'll try to use that. Otherwise we'll just search all pages in order.
  const pageCount = getPdfViewer().pagesCount;
  const pageIndexes = Array(pageCount)
    .fill(0)
    .map((_, i) => i);

  let expectedPageIndex;
  let expectedOffsetInPage;

  if (positionHint) {
    const { index, offset } = await findPageByOffset(positionHint);
    expectedPageIndex = index;
    expectedOffsetInPage = positionHint - offset;

    // Sort pages by distance from the page where we expect to find the quote,
    // based on the position hint.
    pageIndexes.sort((a, b) => {
      const distA = Math.abs(a - index);
      const distB = Math.abs(b - index);
      return distA - distB;
    });
  }

  // Search pages for the best match, ignoring whitespace differences.
  const [strippedPrefix] = quoteSelector.prefix !== undefined
    ? stripSpaces(quoteSelector.prefix)
    : [];
  const [strippedSuffix] = quoteSelector.suffix !== undefined
    ? stripSpaces(quoteSelector.suffix)
    : [];
  const [strippedQuote] = stripSpaces(quoteSelector.exact);

  let bestMatch;
  for (const page of pageIndexes) {
    // eslint-disable-next-line no-await-in-loop
    const text = await getPageTextContent(page);
    const [strippedText, offsets] = stripSpaces(text);

    // Determine expected offset of quote in current page based on position hint.
    let strippedHint;
    if (expectedPageIndex !== undefined && expectedOffsetInPage !== undefined) {
      let hint;
      if (page < expectedPageIndex) {
        hint = text.length; // Prefer matches closer to end of page.
      } else if (page === expectedPageIndex) {
        hint = expectedOffsetInPage;
      } else {
        hint = 0; // Prefer matches closer to start of page.
      }

      // Convert expected offset in original text into offset into stripped text.
      strippedHint = 0;
      while (strippedHint < offsets.length && offsets[strippedHint] < hint) {
        strippedHint += 1;
      }
    }

    const match = matchQuote(strippedText, strippedQuote, {
      prefix: strippedPrefix,
      suffix: strippedSuffix,
      hint: strippedHint,
    });

    if (!match) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!bestMatch || match.score > bestMatch.match.score) {
      bestMatch = {
        page,
        match: {
          start: offsets[match.start],

          // `match.end` is the offset one past the last character of the match
          // in the stripped text. We need the offset one past the corresponding
          // character in the original text.
          //
          // We assume here that matches returned by `matchQuote` must have
          // be non-empty, so `match.end` > `match.start`.
          end: offsets[match.end - 1] + 1,

          score: match.score,
        },
      };

      // If we find a very good match, stop early.
      //
      // There is a tradeoff here between optimizing search performance and
      // ensuring that we have found the best match in the document.
      //
      // The current heuristics are that we require an exact match for the quote
      // and either the preceding or following context. The context matching
      // helps to avoid incorrectly stopping the search early if the quote is
      // a word or phrase that is common in the document.
      const exactQuoteMatch = strippedText.slice(match.start, match.end) === strippedQuote;

      const exactPrefixMatch = strippedPrefix !== undefined
        && strippedText.slice(
          Math.max(0, match.start - strippedPrefix.length),
          match.start
        ) === strippedPrefix;

      const exactSuffixMatch = strippedSuffix !== undefined
        && strippedText.slice(match.end, strippedSuffix.length) === strippedSuffix;

      const hasContext = strippedPrefix !== undefined || strippedSuffix !== undefined;

      if (
        exactQuoteMatch
        && (exactPrefixMatch || exactSuffixMatch || !hasContext)
      ) {
        break;
      }
    }
  }

  if (bestMatch) {
    const { page, match } = bestMatch;

    // If we found a match, optimize future anchoring of this selector in the
    // same session by caching the match location.
    if (positionHint) {
      const cacheKey = quotePositionCacheKey(quoteSelector.exact, positionHint);
      quotePositionCache.set(cacheKey, {
        pageIndex: page,
        anchor: match,
      });
    }

    // Convert the (start, end) position match into a DOM range.
    return anchorByPosition(page, match.start, match.end);
  }

  throw new Error('Quote not found');
}
