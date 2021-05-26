import { AuthToken, CommunicationSettings } from '@pundit/communication';
import { uniqueId } from 'lodash';
import { environment as env } from '../environments/environment';
import {
  CrossMsgData, CommonEventType, StorageKey, StorageOperationType, CrossMsgRequestId
} from './types';

const crossMessageEnabled = () => !!(
  env.chromeExt && document.location.protocol !== 'chrome-extension:'
);

const tokenSyncChromeExt = (token: AuthToken, forceRemove: boolean) => {
  let signal;
  if (forceRemove) {
    signal = new CustomEvent(CommonEventType.StorageRequest, {
      detail: {
        operation: StorageOperationType.Remove,
        key: StorageKey.Token
      }
    });
  } else if (token) {
    signal = new CustomEvent(CommonEventType.StorageRequest, {
      detail: {
        operation: StorageOperationType.Set,
        key: StorageKey.Token,
        token
      }
    });
  }

  if (signal) {
    window.dispatchEvent(signal);
  }
};

const tokenSyncEmbed = (token: AuthToken, forceRemove: boolean) => {
  if (forceRemove) {
    localStorage.removeItem(StorageKey.Token);
  } else if (token) {
    localStorage.setItem(StorageKey.Token, JSON.stringify(token));
  }
};

const tokenSync = (forceRemove = false): Promise<void> => new Promise<void>((resolve) => {
  const { token } = CommunicationSettings;
  if (env.chromeExt) {
    // emit signal to chrome-ext
    tokenSyncChromeExt(token, forceRemove);
  } else {
    tokenSyncEmbed(token, forceRemove);
  }
  resolve();
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

      if (requestId === CrossMsgRequestId.AuthLogout) {
        return tokenSync(true).then(() => result);
      }
      return tokenSync().then(() => result);
    };
  };
}
