import { PDFViewerApplication } from '../../anchoring/pdf/types';
import { normalizeURI } from './normalizeURI';

/**
 * @param {PDFViewerApplication} app
 * @return {string|null} - Valid URL string or `null`
 */
export function getPDFURL(app: PDFViewerApplication): string {
  if (!app.url) {
    return null;
  }

  const url = normalizeURI(app.url);

  // Local file:// URLs should not be saved in document metadata.
  // Entries in document.link should be URIs. In the case of
  // local files, omit the URL.
  if (url.indexOf('file://') !== 0) {
    return url;
  }

  return null;
}
