import { Observable } from 'rxjs';

export enum StorageKey {
  User = 'pundit-user',
  Token = 'pundit-token',
  Notebook = 'pundit-notebook'
}

export interface StorageProvider {
  get: (key: StorageKey) => Observable<string | null>;
  set: (key: StorageKey, value: string) => void;
  remove: (key: StorageKey) => void;
}
