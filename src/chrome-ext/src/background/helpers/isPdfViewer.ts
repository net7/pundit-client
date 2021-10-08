import { getPdfViewerPath } from '.';

export const isPdfViewer = (url: string) => typeof url === 'string' && url.indexOf(
  getPdfViewerPath()
) === 0;
