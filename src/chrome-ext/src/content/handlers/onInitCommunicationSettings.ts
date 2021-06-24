import { CommonEventType } from '../../../../common/types';

export const onInitCommunicationSettings = (ev: CustomEvent) => {
  chrome.runtime.sendMessage({
    type: CommonEventType.InitCommunicationSettings,
    payload: ev.detail
  });
};
