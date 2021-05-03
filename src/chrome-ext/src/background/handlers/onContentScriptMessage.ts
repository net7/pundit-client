import { EventType } from '../../types';
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
    case EventType.AnnotationsUpdate:
      helpers.updateBadgeText(tab.id, payload);
      helpers.updateBadgeTitle(tab.id, payload);
      break;
    case EventType.RootElementExists:
      onBrowserActionClicked(tab);
      break;
    case EventType.StorageRequest:
      helpers.doStorageRequest(tab, payload);
      break;
    default:
      break;
  }
};
