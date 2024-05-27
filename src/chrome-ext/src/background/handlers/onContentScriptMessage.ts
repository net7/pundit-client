import { CommunicationSettings } from '@pundit/communication';
// import mixpanel from 'mixpanel-browser';
import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '.';
import * as helpers from '../helpers';
import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

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
      // storage save to future use
      ChromeExtStorage.set(ChromeExtStorageKey.ApiBaseUrl, payload.apiBaseUrl);
      ChromeExtStorage.set(ChromeExtStorageKey.AuthBaseUrl, payload.authBaseUrl);
      // mixpanel config
      // mixpanel.init(payload.mixpanelToken);
      break;
    case CommonEventType.ImageDataRequest:
      helpers.doImageDataRequest(tab, payload);
      break;
    case CommonEventType.DocumentInfoResponse:
      CommunicationSettings.apiBaseUrl = CommunicationSettings.apiBaseUrl || API_BASE_URL;
      CommunicationSettings.token = null;
      helpers.doPageAnnotationsRequest(tab.id, payload).then(({ tabId, total }) => {
        if (tabId === tab.id && total !== null) {
          helpers.updateBadgeText(tab.id, total);
        }
      }).catch((err) => {
        console.warn('Annotations request: ', err);
      });
      break;
    default:
      break;
  }
};
