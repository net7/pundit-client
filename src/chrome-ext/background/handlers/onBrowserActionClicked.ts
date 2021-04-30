import { ChromeExtStorage } from 'src/chrome-ext/storage';
import { StorageKeys } from 'src/chrome-ext/types';
import * as helpers from '../helpers';

export const onBrowserActionClicked = ({ id }: chrome.tabs.Tab) => {
  const activeKey = `${StorageKeys.Active}.${id}`;
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
