import { PDFViewer, PDFViewerApplication as PDFViewerApp } from './types';

declare let PDFViewerApplication;

/**
 * Get the PDF.js viewer application.
 *
 * @return {PDFViewer}
 */
export function getPdfViewer(): PDFViewer {
  return (PDFViewerApplication as PDFViewerApp).pdfViewer;
}
