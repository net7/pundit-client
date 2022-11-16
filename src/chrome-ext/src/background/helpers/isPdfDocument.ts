import { getPdfViewerPath } from '.';

export const isPdfDocument = (url: string) => (
  typeof url === 'string'
  && url.includes('.pdf')
  && !url.startsWith(getPdfViewerPath())
);
