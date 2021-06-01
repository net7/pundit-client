import { CommonEventType } from '../../../../common/types';

export const onImageDataRequest = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: CommonEventType.ImageDataRequest,
    payload: ev.detail
  });
};
