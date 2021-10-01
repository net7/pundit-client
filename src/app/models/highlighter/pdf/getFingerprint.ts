import { PDFViewerApplication } from '../../anchoring/pdf/types';

/**
 * Get the fingerprint/file identifier of the currently loaded PDF.
 *
 * @param {PDFViewerApplication} app
 */
export function getFingerprint(app: PDFViewerApplication): string {
  if (Array.isArray(app.pdfDocument.fingerprints)) {
    return app.pdfDocument.fingerprints[0];
  }
  return app.pdfDocument.fingerprint;
}
