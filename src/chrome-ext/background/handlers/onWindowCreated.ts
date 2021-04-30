import { ChromeExtStorage } from 'src/chrome-ext/storage';
import { StorageKeys } from 'src/chrome-ext/types';

export const onWindowCreated = (currentWindow: chrome.windows.Window) => {
  if (currentWindow.incognito) {
    ChromeExtStorage.set(`${StorageKeys.Incognito}.${currentWindow.id}`, true);
  }
};
