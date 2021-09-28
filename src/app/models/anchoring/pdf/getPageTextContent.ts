import { getPageView } from './getPageView';
import { pageTextCache } from './state';

/**
 * Return the text of a given PDF page.
 *
 * The page text returned by this function should match the `textContent` of the
 * text layer element that PDF.js creates for rendered pages. This allows
 * offsets computed in the text to be reused as offsets within the text layer
 * element's content. This is important to create correct Ranges for anchored
 * selectors.
 *
 * @param {number} pageIndex
 * @return {Promise<string>}
 */
export function getPageTextContent(pageIndex: number): Promise<string> {
  // If we already have or are fetching the text for this page, return the
  // existing result.
  const cachedText = pageTextCache.get(pageIndex);
  if (cachedText) {
    return cachedText;
  }

  const getPageText = async () => {
    const pageView = await getPageView(pageIndex);
    const textContent = await pageView.pdfPage.getTextContent({
      normalizeWhitespace: true,
    });
    let { items } = textContent;

    // Versions of PDF.js < v2.9.359 did not create elements in the text layer for
    // text items that contained all-whitespace strings. Newer versions (after
    // https://github.com/mozilla/pdf.js/pull/13257) do. The same commit also
    // introduced the `hasEOL` property to text items, so we use the absence
    // of this property to determine if we need to filter out whitespace-only strings.
    const excludeEmpty = items.length > 0 && !('hasEOL' in items[0]);
    if (excludeEmpty) {
      items = items.filter((it) => /\S/.test(it.str));
    }

    return items.map((it) => it.str).join('');
  };

  // This function synchronously populates the cache with a promise so that
  // multiple calls don't call `PDFPageProxy.getTextContent` twice.
  const pageText = getPageText();
  pageTextCache.set(pageIndex, pageText);
  return pageText;
}
