/**
 * Information about the page where a particular character position in the
 * text of the document occurs.
 *
 * @typedef PageOffset
 * @prop {number} index - Index of page containing offset
 * @prop {number} offset -
 *  Character position of the start of `textContent`
 *  within the full text of the document
 * @prop {string} textContent - Full text of page containing offset
 */

import { getPageTextContent } from './getPageContext';
import { getPdfViewer } from './getPdfViewer';

/**
 * Find the index and text content of a page containing the character position
 * `offset` within the complete text of the document.
 *
 * @param {number} offset
 * @return {Promise<PageOffset>}
 */
export function findPage(offset) {
  let index = 0;
  let total = 0;

  // We call `count` once for each page, in order. The passed offset is found on
  // the first page where the cumulative length of the text content exceeds the
  // offset value.
  //
  // When we find the page the offset is on, we return an object containing the
  // page index, the offset at the start of that page, and the textContent of
  // that page.
  //
  // To understand this a little better, here's a worked example. Imagine a
  // document with the following page lengths:
  //
  //    Page 0 has length 100
  //    Page 1 has length 50
  //    Page 2 has length 50
  //
  // Then here are the pages that various offsets are found on:
  //
  //    offset | index
  //    --------------
  //    0      | 0
  //    99     | 0
  //    100    | 1
  //    101    | 1
  //    149    | 1
  //    150    | 2S
  const count = (textContent) => {
    const lastPageIndex = getPdfViewer().pagesCount - 1;
    if (total + textContent.length > offset || index === lastPageIndex) {
      // Offset is in current page.
      // eslint-disable-next-line no-param-reassign
      offset = total;
      return Promise.resolve({ index, offset, textContent });
    }
    // Offset is within a subsequent page.
    index += 1;
    total += textContent.length;
    return getPageTextContent(index).then(count);
  };

  return getPageTextContent(0).then(count);
}
