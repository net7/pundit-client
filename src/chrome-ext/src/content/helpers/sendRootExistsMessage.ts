import { state } from '../state';
import { EventType } from '../../types';

export const sendRootExistsMessage = () => {
  chrome.runtime.sendMessage({ type: EventType.RootElementExists });
  setTimeout(() => {
    if (!state.get('rootExistMessageSended')) {
      state.set({ rootExistMessageSended: true });
      window.dispatchEvent(new CustomEvent(EventType.RootElementExists));
    }
  }, 3000);
};
