import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import {
  isPdfDocument,
  isPdfViewer,
  isFeedPdfUrl,
  redirectToOriginalPdfUrl,
  redirectToPdfViewer,
  updateExtensionIcon,
  getFeedPdfSource
} from '.';
import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '../handlers/onBrowserActionClicked';

export const checkActiveState = (tabId: number) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      const { windowId } = tab;
      chrome.windows.get(windowId, (window) => {
        // popup check
        if (window.type === 'popup') {
          return;
        }
        const activeKey = `${ChromeExtStorageKey.Active}.${tabId}`;
        ChromeExtStorage.get(activeKey)
          .then((active: boolean) => {
            const { url: tabUrl, status: tabStatus } = tab;
            const isPdf = isPdfDocument(tabUrl);
            const isViewer = isPdfViewer(tabUrl);
            const isFeed = isFeedPdfUrl(tabUrl);
            if (isPdf && isFeed) {
              const pdfSource = getFeedPdfSource(tabUrl);
              // redirect
              chrome.tabs.update({
                url: decodeURIComponent(pdfSource)
              });
              // trigger click
              if (!active) {
                setTimeout(() => {
                  onBrowserActionClicked(tab);
                });
              }
            } else if (active && isPdf) {
              redirectToPdfViewer(tabUrl);
            } else if (!active && isViewer) {
              redirectToOriginalPdfUrl(tabUrl);
            } else {
              // if inactive get document/page url
              // total annotations number
              const payload = { active };
              if (tabStatus === 'complete') {
                chrome.tabs.sendMessage(tabId, {
                  payload,
                  type: CommonEventType.DocumentInfoRequest,
                });
              }
              chrome.tabs.sendMessage(tabId, {
                payload,
                type: CommonEventType.StateChanged,
              });
            }
            updateExtensionIcon(tabId, active);
          });
      });
    }
  });
};
