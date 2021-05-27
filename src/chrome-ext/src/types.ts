export type ChromeExtStorageData = {
  [key: string]: ChromeExtStorageValue;
}

export type ChromeExtStorageValue = string | object | boolean | null;

export enum ChromeExtStorageKey {
  Active = 'active',
  Incognito = 'incognito'
}

export type ChromeExtStateKey = 'appRoot'
  | 'badgeInterval'
  | 'badgeIntervalCount'
  | 'rootExistMessageSended';

export type IntervalFunc = (func: Function, ms: number) => void;

export type ChromeExtStateData = {
  appRoot: HTMLElement;
  badgeInterval: any;
  badgeIntervalCount: number;
  rootExistMessageSended: boolean;
};

export type RuntimeMessage = {
  type: string;
  payload: any;
};
