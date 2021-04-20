import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageKey, StorageProvider } from './storage.types';

@Injectable()
export class StorageService implements StorageProvider {
  public set(key: StorageKey, value: string): void {
    localStorage.setItem(key, value);
  }

  public get(key: StorageKey): Observable<string | null> {
    return of(localStorage.getItem(key));
  }

  public remove(key: StorageKey) {
    localStorage.removeItem(key);
  }
}
