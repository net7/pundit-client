import { CommunicationSettings } from '@pundit/communication';
import { environment as env } from '../../environments/environment';
import { CommonEventType, StorageKey } from '../types';

export const setTokenFromStorage = () => {
  if (env.chromeExt) {
    // emit signal
    const signal = new CustomEvent(CommonEventType.SetTokenFromStorage);
    window.dispatchEvent(signal);
  } else {
    const storageToken = localStorage.getItem(StorageKey.Token);
    CommunicationSettings.token = storageToken;
  }
};
