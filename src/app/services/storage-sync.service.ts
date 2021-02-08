import { Injectable } from '@angular/core';
import { environment as env } from '../../environments/environment';

export enum StorageSyncKey {
  User = 'pundit-user',
  Token = 'pundit-token',
  Notebook = 'pundit-notebook'
}

@Injectable()
export class StorageSyncService {
  public set(key: StorageSyncKey, value: string) {
    if (env.chromeExt) return;

    localStorage.setItem(key, value);
  }

  public get(key: StorageSyncKey): string | null {
    if (env.chromeExt) return null;

    return localStorage.getItem(key);
  }

  public remove(key: StorageSyncKey) {
    if (env.chromeExt) return;

    localStorage.removeItem(key);
  }
}
