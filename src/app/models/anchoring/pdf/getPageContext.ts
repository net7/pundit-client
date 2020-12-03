import { getPageView } from './getPageView';

/**
 * Map of page index to page text content.
 *
 * @type {Object<number,Promise<string>>}
 */
const pageTextCache = {};

/**
 * Return the text of a given PDF page.
 *
 * @param {number} pageIndex
 * @return {Promise<string>}
 */
export async function getPageTextContent(pageIndex) {
  if (pageTextCache[pageIndex]) {
    return pageTextCache[pageIndex];
  }

  // Join together PDF.js `TextItem`s representing pieces of text in a PDF page.
  const joinItems = (items) => {
    // Skip empty items since PDF.js leaves their text layer divs blank.
    // Excluding them makes our measurements match the rendered text layer.
    // Otherwise, the selectors we generate would not match this stored text.
    // See the `appendText` method of `TextLayerBuilder` in PDF.js.
    const nonEmpty = items
      .filter((item) => /\S/.test(item.str))
      .map((item) => item.str);
    const textContent = nonEmpty.join('');
    return textContent;
  };

  // Fetch the text content for a given page as a string.
  const getTextContent = async (pgindx) => {
    const pageView = await getPageView(pgindx);
    const textContent = await pageView.pdfPage.getTextContent({
      normalizeWhitespace: true,
    });
    return joinItems(textContent.items);
  };

  pageTextCache[pageIndex] = getTextContent(pageIndex);

  return pageTextCache[pageIndex];
}
