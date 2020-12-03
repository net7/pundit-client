import { getPdfViewer } from './getPdfViewer';

/**
 * Returns the view into which a PDF page is drawn.
 *
 * If called while the PDF document is still loading, this will delay until
 * the document loading has progressed far enough for a `PDFPageView` and its
 * associated `PDFPage` to be ready.
 *
 * @param {number} pageIndex
 * @return {Promise<PDFPageView>}
 */
export async function getPageView(pageIndex) {
  const pdfViewer = getPdfViewer();
  let pageView = pdfViewer.getPageView(pageIndex);

  if (!pageView || !pageView.pdfPage) {
    // If the document is still loading, wait for the `pagesloaded` event.
    //
    // Note that loading happens in several stages. Initially the page view
    // objects do not exist (`pageView` will be nullish), then after the
    // "pagesinit" event, the page view exists but it does not have a `pdfPage`
    // property set, then finally after the "pagesloaded" event, it will have
    // a "pdfPage" property.
    pageView = await new Promise((resolve) => {
      const onPagesLoaded = () => {
        if (pdfViewer.eventBus) {
          pdfViewer.eventBus.off('pagesloaded', onPagesLoaded);
        } else {
          document.removeEventListener('pagesloaded', onPagesLoaded);
        }

        resolve(pdfViewer.getPageView(pageIndex));
      };

      if (pdfViewer.eventBus) {
        pdfViewer.eventBus.on('pagesloaded', onPagesLoaded);
      } else {
        // Old PDF.js versions (< 1.6.210) use DOM events.
        document.addEventListener('pagesloaded', onPagesLoaded);
      }
    });
  }

  return /** @type {PDFPageView} */ (pageView);
}
