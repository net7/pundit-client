import { AuthToken, CommunicationSettings } from '@pundit/communication';
import { uniqueId } from 'lodash';
import { environment as env } from '../environments/environment';
import {
  CrossMsgData, CommonEventType, StorageKey, CrossMsgRequestId
} from './types';

const crossMessageEnabled = () => !!(
  env.chromeExt && document.location.protocol !== 'chrome-extension:'
);

const tokenSyncChromeExt = (token: AuthToken, forceRemove: boolean) => {
  if (chrome?.storage?.local) {
    if (forceRemove) {
      chrome.storage.local.remove(StorageKey.Token);
    } else if (token) {
      chrome.storage.local.set({ [StorageKey.Token]: token });
    }
  }
};

const tokenSyncEmbed = (token: AuthToken, forceRemove: boolean) => {
  if (forceRemove) {
    localStorage.removeItem(StorageKey.Token);
  } else if (token) {
    localStorage.setItem(StorageKey.Token, JSON.stringify(token));
  }
};

const tokenSync = (forceRemove = false): Promise<boolean> => new Promise<boolean>((resolve) => {
  const { token } = CommunicationSettings;
  if (document.location.protocol === 'chrome-extension:') {
    // emit signal to chrome-ext
    tokenSyncChromeExt(token, forceRemove);
  } else {
    tokenSyncEmbed(token, forceRemove);
  }
  resolve(true);
});

const handlers: {
  [x: string]: {
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
  };
} = {};

window.addEventListener(CommonEventType.CrossMsgResponse, (ev: CustomEvent) => {
  const { detail }: { detail: CrossMsgData } = ev;
  const { messageId, response, error } = detail;
  if (handlers[messageId]) {
    if (error) {
      handlers[messageId].reject(error);
    } else {
      handlers[messageId].resolve(response);
    }
    // clear
    handlers[messageId] = null;
  }
});

export function CrossMessage(requestId: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line func-names
    descriptor.value = function (...args) {
      let result;
      if (crossMessageEnabled()) {
        const idPrefix = new Date().valueOf();
        const messageId = uniqueId(`${idPrefix}_`); // message id
        result = new Promise((res, rej) => {
          handlers[messageId] = {
            resolve: res,
            reject: rej
          };
        });
        // emit signal to chrome-ext
        const signal = new CustomEvent(CommonEventType.CrossMsgRequest, {
          detail: {
            messageId,
            requestId,
            args,
          }
        });
        window.dispatchEvent(signal);
      } else {
        result = originalMethod.apply(this, args);
      }

      const forceRemove = requestId === CrossMsgRequestId.AuthLogout;
      return tokenSync(!!forceRemove)
        .then(() => result.finally(() => {
          tokenSync(!!forceRemove).then(() => {
            // do nothing
          });
        }));
    };
  };
}
