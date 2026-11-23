import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import * as helpers from '../helpers';

export const onBrowserActionClicked = ({ id, url }: chrome.tabs.Tab, skipCheck = false) => {
  // Pundit cannot run there: the action is disabled, but a click can arrive
  // before it is (a tab opened before the service worker started)
  if (helpers.getTabKind(url) === 'unsupported') {
    return;
  }
  const activeKey = `${ChromeExtStorageKey.Active}.${id}`;
  ChromeExtStorage.get(activeKey)
    .then((value) => {
      if (value) {
        return ChromeExtStorage.remove(activeKey);
      }
      return ChromeExtStorage.set(activeKey, !value);
    })
    .then(() => {
      if (!skipCheck) {
        helpers.checkActiveState(id!);
      }
    });
};
