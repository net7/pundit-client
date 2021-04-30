import { EventType } from 'src/chrome-ext/types';

export const onStorageRequest = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: EventType.StorageRequest,
    payload: ev.detail
  });
};
