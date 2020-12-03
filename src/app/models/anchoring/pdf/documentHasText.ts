import { getPageTextContent } from './getPageContext';
import { getPdfViewer } from './getPdfViewer';

/**
 * Return true if the document has selectable text.
 */
export async function documentHasText() {
  const viewer = getPdfViewer();
  let hasText = false;
  for (let i = 0; i < viewer.pagesCount; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const pageText = await getPageTextContent(i);
    if (pageText.trim().length > 0) {
      hasText = true;
      break;
    }
  }
  return hasText;
}
