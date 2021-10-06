import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import {
  isPdfDocument, isPdfViewer, redirectToOriginalPdfUrl, redirectToPdfViewer, updateExtensionIcon
} from '.';
import { CommonEventType } from '../../../../common/types';

export const checkActiveState = (tabId: number) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      const { windowId } = tab;
      chrome.windows.get(windowId, ({ type }) => {
        // popup check
        if (type === 'popup') {
          return;
        }
        const activeKey = `${ChromeExtStorageKey.Active}.${tabId}`;
        ChromeExtStorage.get(activeKey)
          .then((active: boolean) => {
            const { url: tabUrl } = tab;
            if (active && isPdfDocument(tabUrl)) {
              redirectToPdfViewer(tabUrl);
            } else if (!active && isPdfViewer(tabUrl)) {
              redirectToOriginalPdfUrl(tabUrl);
            } else {
              const payload = { active };
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
