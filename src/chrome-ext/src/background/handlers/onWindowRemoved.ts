import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

export const onWindowRemoved = (windowId: number) => {
  const incognitoKey = `${ChromeExtStorageKey.Incognito}.${windowId}`;
  ChromeExtStorage.get(incognitoKey)
    .then((value) => {
      if (value) {
        // remove incognito key
        ChromeExtStorage.remove(incognitoKey);
        // remove incognito window storage keys
        chrome.storage.local.get(null, (items) => {
          Object.keys(items)
            .filter((key) => key.indexOf(`${windowId}`) !== -1)
            .forEach((key) => {
              ChromeExtStorage.remove(key);
            });
        });
      }
    });
};
