import { ChromeExtStorageData, ChromeExtStorageValue } from '../types';

export class ChromeExtStorage {
  static get(key: string): Promise<ChromeExtStorageValue> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (value: ChromeExtStorageData) => {
        resolve(value[key]);
      });
    });
  }

  static getMulti(keys: string[]): Promise<ChromeExtStorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (value: ChromeExtStorageData) => {
        resolve(value);
      });
    });
  }

  static set(key: string, value: ChromeExtStorageValue): Promise<ChromeExtStorageValue> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve(value);
      });
    });
  }

  static remove(key: string): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => {
        resolve(key);
      });
    });
  }
}
