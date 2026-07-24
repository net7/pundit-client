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
  isFeedWebUrl,
} from '.';
import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '../handlers/onBrowserActionClicked';

const handlePdfState = (
  tab: chrome.tabs.Tab,
  tabId: number,
  tabUrl: string,
  active: boolean,
  isPdf: boolean,
  isViewer: boolean,
  isFeedPdf: boolean,
): boolean => {
  let skipIconUpdate = false;
  if (isPdf && isFeedPdf) {
    const pdfSource = getFeedPdfSource(tabUrl);
    // redirect
    redirectToPdfViewer(pdfSource);
    if (!active) {
      skipIconUpdate = true;
      setTimeout(() => {
        onBrowserActionClicked(tab, true);
        updateExtensionIcon(tab.id!, true);
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
  return skipIconUpdate;
};

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
        (ChromeExtStorage.get(activeKey) as Promise<boolean>).then(async (active: boolean) => {
          const tabUrl = tab.url!;

          const isViewer = isPdfViewer(tabUrl);
          const isFeedWeb = isFeedWebUrl(tabUrl);
          const isFeedPdf = isFeedPdfUrl(tabUrl);
          if (isFeedWeb) {
            const webDocumentSource = getFeedWebSource(tabUrl);
            // redirect (getFeedWebSource already returns the decoded URL)
            chrome.tabs.update({
              url: webDocumentSource,
            });
            // trigger click
            if (!active) {
              setTimeout(() => {
                onBrowserActionClicked(tab);
              });
            }
            return;
          }

          const isPdf = await isPdfDocument(tabUrl);
          const skipIconUpdate = handlePdfState(
            tab,
            tabId,
            tabUrl,
            active,
            isPdf,
            isViewer,
            isFeedPdf,
          );
          if (!skipIconUpdate) {
            updateExtensionIcon(tabId, active);
          }
        });
      });
    }
  });
};
