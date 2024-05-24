import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import {
  isPdfDocument,
  isPdfViewer,
  isFeedPdfUrl,
  redirectToOriginalPdfUrl,
  redirectToPdfViewer,
  updateExtensionIcon,
  getFeedPdfSource,
  getFeedWebSource,
  isFeedWebUrl
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
            const {
              url: tabUrl,
              // status: tabStatus
            } = tab;
            fetch(tabUrl).then((response) => {
              const contentType = response.headers.get('Content-Type');
              const isPdf = isPdfDocument(tabUrl, contentType);
              const isViewer = isPdfViewer(tabUrl);
              const isFeedWeb = isFeedWebUrl(tabUrl);
              const isFeedPdf = isFeedPdfUrl(tabUrl);
              let skipIconUpdate = false;
              if (isFeedWeb) {
                const webDocumentSource = getFeedWebSource(tabUrl);
                // redirect
                chrome.tabs.update({
                  url: decodeURIComponent(webDocumentSource)
                });
                // trigger click
                if (!active) {
                  setTimeout(() => {
                    onBrowserActionClicked(tab);
                  });
                }
              } else if (isPdf && isFeedPdf) {
                const pdfSource = getFeedPdfSource(tabUrl);
                // redirect
                redirectToPdfViewer(pdfSource);
                if (!active) {
                  skipIconUpdate = true;
                  setTimeout(() => {
                    onBrowserActionClicked(tab, true);
                    updateExtensionIcon(tab.id, true);
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
                // if (tabStatus === 'complete') {
                //   chrome.tabs.sendMessage(tabId, {
                //     payload,
                //     type: CommonEventType.DocumentInfoRequest,
                //   });
                // }
                chrome.tabs.sendMessage(tabId, {
                  payload,
                  type: CommonEventType.StateChanged,
                });
              }
              if (!skipIconUpdate) {
                updateExtensionIcon(tabId, active);
              }
            });
          });
      });
    }
  });
};
