import { CommonEventType } from '../../../../common/types';

export const onStorageRequest = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: CommonEventType.StorageRequest,
    payload: ev.detail
  });
};
