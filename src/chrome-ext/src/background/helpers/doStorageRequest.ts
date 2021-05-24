import { CommunicationSettings } from '@pundit/communication';
import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageData } from '../../types';
import { CommonEventType } from '../../../../common/types';

export const doStorageRequest = (tab: chrome.tabs.Tab, payload) => {
  const { id: tabId, incognito, windowId } = tab;
  const { key, value, operation } = payload;
  const storageKey = incognito ? `${key}.${windowId}` : key;
  let task$;
  switch (operation) {
    case 'get':
      task$ = ChromeExtStorage.get(storageKey);
      break;
    case 'set':
      task$ = ChromeExtStorage.set(storageKey, value);
      break;
    case 'remove':
      task$ = ChromeExtStorage.remove(storageKey);
      break;
    default:
      break;
  }

  task$.then((storageData: ChromeExtStorageData) => {
    // FIXME: togliere e fare tramite token service
    if (operation === 'get') {
      if (storageData?.access_token) {
        CommunicationSettings.token = storageData.access_token as string;
      }
    }
    chrome.tabs.sendMessage(tabId, {
      type: CommonEventType.StorageResponse,
      payload: {
        status: 'OK',
        data: operation === 'get' ? storageData : undefined
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
