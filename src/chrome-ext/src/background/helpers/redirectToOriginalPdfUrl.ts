import { getPdfViewerPath } from '.';

export const redirectToOriginalPdfUrl = (url: string) => {
  const viewerPath = getPdfViewerPath();
  const originalUrl = url.replace(`${viewerPath}?source=`, '');
  const decodedOriginalUrl = decodeURIComponent(originalUrl);
  // redirect
  chrome.tabs.update({
    url: decodedOriginalUrl
  });
};
