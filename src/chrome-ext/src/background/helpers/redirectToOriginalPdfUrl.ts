import { getPdfViewerPath } from '.';

/** Brings the tab `tabId` (not the focused one) back from the viewer to the PDF. */
export const redirectToOriginalPdfUrl = (tabId: number, url: string) => {
  const viewerPath = getPdfViewerPath();
  const originalUrl = url.replace(`${viewerPath}?source=`, '');
  const decodedOriginalUrl = decodeURIComponent(originalUrl);
  // redirect
  chrome.tabs.update(tabId, {
    url: decodedOriginalUrl
  });
};
