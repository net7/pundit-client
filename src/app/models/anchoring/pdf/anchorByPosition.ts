import { getPageView } from './getPageView';
import { RenderingStates } from '../pdfjs-rendering-states';
import { TextPosition, TextRange } from './text-range';

/**
 * Locate the DOM Range which a position selector refers to.
 *
 * If the page is off-screen it may be in an unrendered state, in which case
 * the text layer will not have been created. In that case a placeholder
 * DOM element is created and the returned range refers to that placeholder.
 * In that case, the selector will need to be re-anchored when the page is
 * scrolled into view.
 *
 * @param {number} pageIndex - The PDF page index
 * @param {number} start - Character offset within the page's text
 * @param {number} end - Character offset within the page's text
 * @return {Promise<Range>}
 */
export async function anchorByPosition(pageIndex, start, end) {
  const page = await getPageView(pageIndex);

  if (
    page.renderingState === RenderingStates.FINISHED
    && page.textLayer
    && page.textLayer.renderingDone
  ) {
    // The page has been rendered. Locate the position in the text layer.
    const root = page.textLayer.textLayerDiv;
    const startPos = new TextPosition(root, start);
    const endPos = new TextPosition(root, end);
    return new TextRange(startPos, endPos).toRange();
  }

  // The page has not been rendered yet. Create a placeholder element and
  // anchor to that instead.
  let placeholder = page.div.querySelector('.annotator-placeholder');
  if (!placeholder) {
    placeholder = document.createElement('span');
    placeholder.classList.add('annotator-placeholder');
    placeholder.textContent = 'Loading annotations…';
    page.div.appendChild(placeholder);
  }
  const range = document.createRange();
  range.setStartBefore(placeholder);
  range.setEndAfter(placeholder);
  return range;
}
