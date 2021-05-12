import { ChromeExtStorage } from '../storage';
import { StorageKeys } from '../../types';

export const onWindowCreated = (currentWindow: chrome.windows.Window) => {
  if (currentWindow.incognito) {
    ChromeExtStorage.set(`${StorageKeys.Incognito}.${currentWindow.id}`, true);
  }
};
