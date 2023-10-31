import { CommunicationSettings } from '@pundit/communication';
import mixpanel from 'mixpanel-browser';
import { environment as env } from '../../environments/environment';
import { CommonEventType } from '../types';

export const initCommunicationSettings = () => {
  if (env.chromeExt) {
    // emit signal
    const signal = new CustomEvent(CommonEventType.InitCommunicationSettings, {
      detail: {
        apiBaseUrl: env.apiBaseUrl,
        authBaseUrl: env.authBaseUrl,
        mixpanelToken: env.analytics.mixpanel.token
      }
    });
    window.dispatchEvent(signal);
  } else {
    CommunicationSettings.apiBaseUrl = env.apiBaseUrl;
    CommunicationSettings.authBaseUrl = env.authBaseUrl;
    // mixpanel config
    mixpanel.init(env.analytics.mixpanel.token);
  }
  // mixpanel config
  mixpanel.init(env.analytics.mixpanel.token);
};
