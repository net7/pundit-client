import { CommunicationSettings } from 'src/communication';
// import mixpanel from 'mixpanel-browser';
import { environment as env } from '../../environments/environment';

/**
 * Sets the API addresses of the models that run in place. In the extension the
 * requests are made by the background service worker, which takes its addresses
 * from the build: nothing is sent to it.
 */
export const initCommunicationSettings = () => {
  if (env.chromeExt) {
    return;
  }
  CommunicationSettings.apiBaseUrl = env.apiBaseUrl;
  CommunicationSettings.authBaseUrl = env.authBaseUrl;
  // mixpanel config
  // mixpanel.init(env.analytics.mixpanel.token);
};
