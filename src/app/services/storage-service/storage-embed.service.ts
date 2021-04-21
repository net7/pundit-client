import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageKey, StorageProvider, StorageValue } from './storage.types';

@Injectable()
export class StorageEmbedService implements StorageProvider {
  public set(key: StorageKey, value: StorageValue): void {
    localStorage.setItem(key, value !== null ? JSON.stringify(value) : null);
  }

  public get(key: StorageKey): Observable<StorageValue> {
    let storageValue = localStorage.getItem(key);
    // check for saved storage key in json format
    try {
      storageValue = JSON.parse(storageValue);
    } catch (_e) {
      // do nothing
    }
    return of(storageValue);
  }

  public remove(key: StorageKey) {
    localStorage.removeItem(key);
  }
}
