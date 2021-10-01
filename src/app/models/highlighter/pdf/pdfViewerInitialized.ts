import { PDFViewerApplication } from '../../anchoring/pdf/types';

/**
 * Wait for a PDFViewerApplication to be initialized.
 *
 * @param {PDFViewerApplication} app
 * @return {Promise<void>}
 */
export function pdfViewerInitialized(app: PDFViewerApplication): Promise<void> {
  // `initializedPromise` was added in PDF.js v2.4.456.
  // See https://github.com/mozilla/pdf.js/pull/11607. In earlier versions the
  // `initialized` property can be queried.
  if (app.initializedPromise) {
    return app.initializedPromise;
  } if (app.initialized) {
    return Promise.resolve();
  }
  // PDF.js < v2.4.456. The recommended approach is to listen for a `localized`
  // DOM event, but this assumes that PDF.js has been configured to publish
  // events to the DOM. Here we simply poll `app.initialized` because it is
  // easier.
  return new Promise((resolve) => {
    const timeout = setInterval(() => {
      if (app.initialized) {
        clearTimeout(timeout);
        resolve();
      }
    }, 5);
  });
}
