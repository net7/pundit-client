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
  const tab = sender.tab!;
  const { type, payload } = message;
  switch (type) {
    case CommonEventType.AnnotationsUpdate:
      helpers.updateBadgeText(tab.id!, payload);
      helpers.updateBadgeTitle(tab.id!, payload);
      break;
    case CommonEventType.RootElementExists:
      onBrowserActionClicked(tab);
      break;
    case CommonEventType.CrossMsgRequest:
      helpers.doCrossMessageRequest(tab, payload);
      break;
    case CommonEventType.ImageDataRequest:
      helpers.doImageDataRequest(tab, payload);
      break;
    case CommonEventType.DocumentInfoResponse:
      helpers.doPageAnnotationsRequest(tab.id!, payload).then(({ tabId, total }) => {
        if (tabId === tab.id && total !== null) {
          helpers.updateBadgeText(tab.id!, total);
        }
      }).catch((err) => {
        console.warn('Annotations request: ', err);
      });
      break;
    default:
      break;
  }
};
