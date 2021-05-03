import { EventType } from '../../types';

export const onStorageRequest = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: EventType.StorageRequest,
    payload: ev.detail
  });
};
