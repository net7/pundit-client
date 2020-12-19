/**
 * Return the canvas element underneath a highlight element in a PDF page's
 * text layer.
 *
 * Returns `null` if the highlight is not above a PDF canvas.
 *
 * @param {HTMLElement} highlightEl -
 *   A `<highlight-tag>` element in the page's text layer
 * @return {HTMLCanvasElement|null}
 */
export function getPdfCanvas(highlightEl): HTMLCanvasElement {
  // This code assumes that PDF.js renders pages with a structure like:
  //
  // <div class="page">
  //   <div class="canvasWrapper">
  //     <canvas></canvas> <!-- The rendered PDF page -->
  //   </div>
  //   <div class="textLayer">
  //      <!-- Transparent text layer with text spans used to enable text selection -->
  //   </div>
  // </div>
  //
  // It also assumes that the `highlightEl` element is somewhere under
  // the `.textLayer` div.

  const pageEl = highlightEl.closest('.page');
  if (!pageEl) {
    return null;
  }

  const canvasEl = pageEl.querySelector('.canvasWrapper > canvas');
  if (!canvasEl) {
    return null;
  }

  return /** @type {HTMLCanvasElement} */ (canvasEl);
}
