import { AuthToken, CommunicationSettings } from '@pundit/communication';
import { CommonEventType, StorageKey } from '../../../../common/types';
import { onBrowserActionClicked } from '.';
import * as helpers from '../helpers';
import { ChromeExtStorage } from '../storage';
import { environment as env } from '../../../../environments/environment';

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
    case CommonEventType.StorageRequest:
      helpers.doStorageRequest(tab, payload);
      break;
    case CommonEventType.CrossMsgRequest:
      helpers.doCrossMessageRequest(tab, payload);
      break;
    case CommonEventType.SetTokenFromStorage:
      ChromeExtStorage.get(StorageKey.Token).then((storageToken) => {
        // FIXME: controllare communication token type
        CommunicationSettings.token = storageToken as AuthToken | null;
      });
      break;
    case CommonEventType.InitCommunicationSettings:
      CommunicationSettings.apiBaseUrl = env.apiBaseURL;
      CommunicationSettings.authBaseUrl = env.authBaseURL;
      break;
    default:
      break;
  }
};
