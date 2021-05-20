import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '.';
import * as helpers from '../helpers';

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
    default:
      break;
  }
};
