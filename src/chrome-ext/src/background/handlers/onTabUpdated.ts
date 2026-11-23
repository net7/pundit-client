import * as helpers from '../helpers';

/**
 * Only a new URL (the tab's kind may change) and a finished load (the content
 * script exists from `document_end`) matter: title, favicon and other updates
 * are ignored.
 */
export const onTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
  if (!changeInfo.url && changeInfo.status !== 'complete') {
    return;
  }
  chrome.tabs.get((tabId), () => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      helpers.checkActiveState(tabId);
    }
  });
};
