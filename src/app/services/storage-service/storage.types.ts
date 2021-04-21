import { Observable } from 'rxjs';

export enum StorageKey {
  User = 'pundit-user',
  Token = 'pundit-token',
  Notebook = 'pundit-notebook'
}

export type StorageValue = string | object | null;
export interface StorageProvider {
  get: (key: StorageKey) => Observable<StorageValue>;
  set: (key: StorageKey, value: StorageValue) => void;
  remove: (key: StorageKey) => void;
}
