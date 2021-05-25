import { AuthToken, CommunicationSettings } from '@pundit/communication';
import { uniqueId } from 'lodash';
import { environment as env } from '../environments/environment';
import {
  CrossMsgData, CommonEventType, StorageKey, StorageOperationType
} from './types';

const crossMessageEnabled = () => !!(
  env.chromeExt && document.location.protocol !== 'chrome-extension:'
);

const tokenSyncChromeExt = (token: AuthToken) => {
  let signal;
  if (token) {
    signal = new CustomEvent(CommonEventType.StorageRequest, {
      detail: {
        operation: StorageOperationType.Set,
        key: StorageKey.Token,
        token
      }
    });
  } else {
    signal = new CustomEvent(CommonEventType.StorageRequest, {
      detail: {
        operation: StorageOperationType.Remove,
        key: StorageKey.Token
      }
    });
  }
  window.dispatchEvent(signal);
};

const tokenSyncEmbed = (token: AuthToken) => {
  if (token) {
    localStorage.setItem(StorageKey.Token, JSON.stringify(token));
  } else {
    localStorage.removeItem(StorageKey.Token);
  }
};

const tokenSync = (): Promise<void> => new Promise<void>((resolve) => {
  const { token } = CommunicationSettings;
  if (env.chromeExt) {
    // emit signal to chrome-ext
    tokenSyncChromeExt(token);
  } else {
    tokenSyncEmbed(token);
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
      return tokenSync().then(() => result);
    };
  };
}
