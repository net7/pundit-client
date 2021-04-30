import * as helpers from '../helpers';

export const onTabUpdated = (tabId: number) => {
  chrome.tabs.get((tabId), () => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      helpers.checkActiveState(tabId);
    }
  });
};
