import { state } from '../state';
import { CommonEventType } from '../../../../common/types';

export const sendRootExistsMessage = () => {
  chrome.runtime.sendMessage({ type: CommonEventType.RootElementExists });
  setTimeout(() => {
    if (!state.get('rootExistMessageSended')) {
      state.set({ rootExistMessageSended: true });
      window.dispatchEvent(new CustomEvent(CommonEventType.RootElementExists));
    }
  }, 3000);
};
