import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import * as helpers from '../helpers';

export const onBrowserActionClicked = ({ id }: chrome.tabs.Tab) => {
  const activeKey = `${ChromeExtStorageKey.Active}.${id}`;
  ChromeExtStorage.get(activeKey)
    .then((value) => {
      if (value) {
        return ChromeExtStorage.remove(activeKey);
      }
      return ChromeExtStorage.set(activeKey, !value);
    })
    .then(() => {
      helpers.checkActiveState(id);
    });
};
