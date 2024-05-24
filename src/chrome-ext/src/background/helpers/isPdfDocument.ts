import { getPdfViewerPath } from '.';

export const isPdfDocument = (url: string, contentType: string) => (
  typeof url === 'string'
  && (url.includes('.pdf') || contentType === 'application/pdf')
  && !url.startsWith(getPdfViewerPath())
);
