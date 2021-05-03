import { ChromeExtStateData, ChromeExtStateKey } from '../types';

class ChromeExtState {
  private data: ChromeExtStateData = {
    appRoot: null,
    badgeInterval: null,
    badgeIntervalCount: 0,
    rootExistMessageSended: false
  }

  set(newData: Partial<ChromeExtStateData>) {
    Object.keys(newData).forEach((key) => {
      this.data[key] = newData[key];
    });
  }

  get(key: ChromeExtStateKey) {
    return this.data[key] || null;
  }
}

export const state = new ChromeExtState();
