import { CommonEventType } from '../../../../common/types';

export const onCrossMessageRequest = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: CommonEventType.CrossMsgRequest,
    payload: ev.detail
  });
};
