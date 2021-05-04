import { ChromeExtStorage } from '../storage';
import { EventType, StorageKeys } from '../../types';
import { updateExtensionIcon } from '.';

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
        const activeKey = `${StorageKeys.Active}.${tabId}`;
        ChromeExtStorage.get(activeKey)
          .then((active: boolean) => {
            const payload = { active };
            chrome.tabs.sendMessage(tabId, {
              payload,
              type: EventType.StateChanged,
            });
            updateExtensionIcon(tabId, active);
          });
      });
    }
  });
};
