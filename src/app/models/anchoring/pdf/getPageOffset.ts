import { getPageTextContent } from './getPageTextContent';
import { getPdfViewer } from './getPdfViewer';

/**
 * Find the offset within the document's text at which a page begins.
 *
 * @param {number} pageIndex
 * @return {Promise<number>} - Offset of page's text within document text
 */
export async function getPageOffset(pageIndex: number): Promise<number> {
  const viewer = getPdfViewer();
  if (pageIndex >= viewer.pagesCount) {
    /* istanbul ignore next - This should never be triggered */
    throw new Error('Invalid page index');
  }
  let offset = 0;
  for (let i = 0; i < pageIndex; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const text = await getPageTextContent(i);
    offset += text.length;
  }
  return offset;
}
