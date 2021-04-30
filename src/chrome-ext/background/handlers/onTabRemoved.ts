import { ChromeExtStorage } from 'src/chrome-ext/storage';
import { StorageKeys } from 'src/chrome-ext/types';

export const onTabRemoved = (tabId: number) => {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  ChromeExtStorage.remove(activeKey);
};
