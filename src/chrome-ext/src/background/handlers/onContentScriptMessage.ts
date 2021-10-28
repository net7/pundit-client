import { CommunicationSettings } from '@pundit/communication';
import mixpanel from 'mixpanel-browser';
import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '.';
import * as helpers from '../helpers';

// webpack build env variables
declare const API_BASE_URL: string;

type RuntimeMessage = {
  type: string;
  payload: any;
};

export const onContentScriptMessage = (
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender
) => {
  const { tab } = sender;
  const { type, payload } = message;
  switch (type) {
    case CommonEventType.AnnotationsUpdate:
      helpers.updateBadgeText(tab.id, payload);
      helpers.updateBadgeTitle(tab.id, payload);
      break;
    case CommonEventType.RootElementExists:
      onBrowserActionClicked(tab);
      break;
    case CommonEventType.CrossMsgRequest:
      helpers.doCrossMessageRequest(tab, payload);
      break;
    case CommonEventType.InitCommunicationSettings:
      // communication config
      CommunicationSettings.apiBaseUrl = payload.apiBaseUrl;
      CommunicationSettings.authBaseUrl = payload.authBaseUrl;
      // mixpanel config
      mixpanel.init(payload.mixpanelToken);
      break;
    case CommonEventType.ImageDataRequest:
      helpers.doImageDataRequest(tab, payload);
      break;
    case CommonEventType.DocumentUrlResponse:
      CommunicationSettings.apiBaseUrl = CommunicationSettings.apiBaseUrl || API_BASE_URL;
      helpers.doPageAnnotationsRequest(tab.id, payload).then(({ tabId, response }) => {
        if (tabId === tab.id) {
          const { stats } = response.data;
          helpers.updateBadgeText(tab.id, stats.total);
        }
      }).catch((err) => {
        console.warn('Annotations request: ', err);
      });
      break;
    default:
      break;
  }
};
