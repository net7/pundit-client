import { CommonEventType } from '../../../../common/types';

export const onSetTokenFromStorage = () => {
  chrome.runtime.sendMessage({
    type: CommonEventType.SetTokenFromStorage
  });
};
