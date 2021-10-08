import { getPdfViewerPath } from '.';

export const isPdfDocument = (url: string) => (
  typeof url === 'string'
  && url.endsWith('.pdf')
  && !url.startsWith(getPdfViewerPath())
);
