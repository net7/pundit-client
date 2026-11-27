import { getPdfViewerPath } from '.';

/** Opens `url` in the PDF viewer, in the tab `tabId` (not the focused one). */
export const redirectToPdfViewer = (tabId: number, url: string) => {
  const viewerPath = getPdfViewerPath();
  const documentUrl = url;
  const documentEncodedUrl = encodeURIComponent(documentUrl);
  const redirectUrl = `${viewerPath}?source=${documentEncodedUrl}`;
  // redirect
  chrome.tabs.update(tabId, {
    url: redirectUrl
  });
};
