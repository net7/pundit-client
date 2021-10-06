import { getPdfViewerPath } from '.';

export const redirectToPdfViewer = (url: string) => {
  const viewerPath = getPdfViewerPath();
  const documentUrl = url;
  const documentEncodedUrl = encodeURIComponent(documentUrl);
  const redirectUrl = `${viewerPath}?source=${documentEncodedUrl}`;
  // redirect
  chrome.tabs.update({
    url: redirectUrl
  });
};
