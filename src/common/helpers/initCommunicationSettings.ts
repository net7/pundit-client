import { CommunicationSettings } from '@pundit/communication';
import { environment as env } from '../../environments/environment';
import { CommonEventType } from '../types';

export const initCommunicationSettings = () => {
  if (env.chromeExt) {
    // emit signal
    const signal = new CustomEvent(CommonEventType.InitCommunicationSettings);
    window.dispatchEvent(signal);
  } else {
    CommunicationSettings.apiBaseUrl = env.apiBaseUrl;
    CommunicationSettings.authBaseUrl = env.authBaseUrl;
  }
};
