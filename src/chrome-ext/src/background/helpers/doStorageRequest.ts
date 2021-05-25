import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageData } from '../../types';
import { CommonEventType, StorageOperationType } from '../../../../common/types';

export const doStorageRequest = (tab: chrome.tabs.Tab, payload) => {
  const { id: tabId, incognito, windowId } = tab;
  const { key, value, operation } = payload;
  const storageKey = incognito ? `${key}.${windowId}` : key;
  let task$;
  switch (operation) {
    case StorageOperationType.Get:
      task$ = ChromeExtStorage.get(storageKey);
      break;
    case StorageOperationType.Set:
      task$ = ChromeExtStorage.set(storageKey, value);
      break;
    case StorageOperationType.Remove:
      task$ = ChromeExtStorage.remove(storageKey);
      break;
    default:
      break;
  }

  task$.then((storageData: ChromeExtStorageData) => {
    chrome.tabs.sendMessage(tabId, {
      type: CommonEventType.StorageResponse,
      payload: {
        status: 'OK',
        data: operation === StorageOperationType.Get ? storageData : undefined
      }
    });
  }).catch((err) => {
    console.warn('StorageRequest error', err);
    chrome.tabs.sendMessage(tabId, {
      type: CommonEventType.StorageResponse,
      payload: {
        status: 'KO'
      }
    });
  });
};
