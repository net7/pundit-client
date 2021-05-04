import { ChromeExtStorage } from '../storage';
import { StorageKeys } from '../../types';

export const onTabRemoved = (tabId: number) => {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  ChromeExtStorage.remove(activeKey);
};
