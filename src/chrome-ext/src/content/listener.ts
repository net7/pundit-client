import { CommonEventType } from '../../../common/types';
import { RuntimeMessage } from '../types';
import { destroyExtension } from './destroyExtension';
import { loadExtension } from './loadExtension';

export const listen = () => {
  // background script messages listener
  chrome.runtime.onMessage.addListener((
    message: RuntimeMessage
  ) => {
    const { type, payload } = message;
    switch (type) {
      case CommonEventType.StateChanged: {
        const { active } = payload;
        if (active) {
          loadExtension();
        } else {
          destroyExtension();
        }
        break;
      }
      case CommonEventType.StorageResponse: {
        const signal = new CustomEvent(CommonEventType.StorageResponse, {
          detail: payload
        });
        window.dispatchEvent(signal);
        break;
      }
      case CommonEventType.CrossMsgResponse: {
        const signal = new CustomEvent(CommonEventType.CrossMsgResponse, {
          detail: payload
        });
        window.dispatchEvent(signal);
        break;
      }
      case CommonEventType.ImageDataResponse: {
        const signal = new CustomEvent(CommonEventType.ImageDataResponse, {
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
