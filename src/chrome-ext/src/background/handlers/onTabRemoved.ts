import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

export const onTabRemoved = (tabId: number) => {
  const activeKey = `${ChromeExtStorageKey.Active}.${tabId}`;
  ChromeExtStorage.remove(activeKey);
};
