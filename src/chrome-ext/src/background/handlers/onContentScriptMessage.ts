import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '.';
import * as helpers from '../helpers';
import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

type RuntimeMessage = {
  type: string;
  payload: any;
};

/** Whether the user switched Pundit on in the tab, read as checkActiveState does. */
const isTabActive = (tabId?: number) => (
  ChromeExtStorage.get(`${ChromeExtStorageKey.Active}.${tabId}`).then((active) => !!active)
);

/**
 * Serves a request of the page only in a tab where the user switched Pundit on: the app is
 * loaded only there, so no legitimate request is lost. Otherwise nothing is sent or answered.
 */
const whenTabActive = (tab: chrome.tabs.Tab, serve: () => void) => {
  isTabActive(tab.id).then((active) => {
    if (active) {
      serve();
    }
  });
};

export const onContentScriptMessage = (
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender
) => {
  // only this extension's content scripts, in a tab
  if (sender.id !== chrome.runtime.id || !sender.tab) {
    return;
  }
  const { tab } = sender;
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
      whenTabActive(tab, () => helpers.doCrossMessageRequest(tab, payload));
      break;
    case CommonEventType.ImageDataRequest:
      whenTabActive(tab, () => helpers.doImageDataRequest(tab, payload));
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
