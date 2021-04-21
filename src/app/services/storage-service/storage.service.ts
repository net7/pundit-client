import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageChromeExtService } from './storage-chrome-ext.service';
import { StorageEmbedService } from './storage-embed.service';
import { StorageKey, StorageProvider, StorageValue } from './storage.types';
import { environment as env } from '../../../environments/environment';

@Injectable()
export class StorageService implements StorageProvider {
  private provider: StorageProvider;

  constructor(
    private storageEmbedService: StorageEmbedService,
    private storageChromeExtService: StorageChromeExtService,
  ) {
    if (env.chromeExt) {
      this.provider = this.storageChromeExtService;
    } else {
      this.provider = this.storageEmbedService;
    }
  }

  public set(key: StorageKey, value: StorageValue): void {
    this.provider.set(key, value);
  }

  public get(key: StorageKey): Observable<StorageValue> {
    return this.provider.get(key);
  }

  public remove(key: StorageKey) {
    this.provider.remove(key);
  }
}
