import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

export const onWindowCreated = (currentWindow: chrome.windows.Window) => {
  if (currentWindow.incognito) {
    ChromeExtStorage.set(`${ChromeExtStorageKey.Incognito}.${currentWindow.id}`, true);
  }
};
