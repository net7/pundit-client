import { EventType, RuntimeMessage } from 'src/chrome-ext/types';
import { destroyExtension } from './destroyExtension';
import { loadExtension } from './loadExtension';

export const listen = () => {
  // background script messages listener
  chrome.runtime.onMessage.addListener((
    message: RuntimeMessage
  ) => {
    const { type, payload } = message;
    switch (type) {
      case EventType.StateChanged: {
        const { active } = payload;
        if (active) {
          loadExtension();
        } else {
          destroyExtension();
        }
        break;
      }
      case EventType.StorageResponse: {
        const signal = new CustomEvent(EventType.StorageResponse, {
          detail: payload
        });
        window.dispatchEvent(signal);
        break;
      }
      default:
        break;
    }
  });
};
