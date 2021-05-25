import { CommonEventType } from '../../../../common/types';

export const onInitCommunicationSettings = () => {
  chrome.runtime.sendMessage({
    type: CommonEventType.InitCommunicationSettings
  });
};
