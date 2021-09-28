import { getPageTextContent } from './getPageContext';
import { getPdfViewer } from './getPdfViewer';
import { PageOffset } from './types';

/**
 * Find the page containing a text offset within the document.
 *
 * If the offset is invalid (less than 0 or greater than the length of the document)
 * then the nearest (first or last) page is returned.
 *
 * @param {number} offset
 * @return {Promise<PageOffset>}
 */
export async function findPageByOffset(offset: number): Promise<PageOffset> {
  const viewer = getPdfViewer();

  let pageStartOffset = 0;
  let pageEndOffset = 0;
  let text = '';

  for (let i = 0; i < viewer.pagesCount; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    text = await getPageTextContent(i);
    pageStartOffset = pageEndOffset;
    pageEndOffset += text.length;

    if (pageEndOffset >= offset) {
      return { index: i, offset: pageStartOffset, text };
    }
  }

  // If the offset is beyond the end of the document, just pretend it was on
  // the last page.
  return { index: viewer.pagesCount - 1, offset: pageStartOffset, text };
}
