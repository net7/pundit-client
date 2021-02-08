import { Injectable } from '@angular/core';
import { CommunicationSettings } from '@pundit/communication';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';

@Injectable()
export class TokenService {
  private token: string;

  constructor(
    private storage: StorageSyncService
  ) {
    const token = this.storage.get(StorageSyncKey.Token);
    if (token) {
      this.set(token, false);
    }
  }

  set(token: string, sync = true) {
    this.token = token;

    // storage sync
    if (sync) {
      this.storage.set(StorageSyncKey.Token, token);
    }

    // add token to communication
    CommunicationSettings.token = token;
  }

  get = () => this.token;

  clear() {
    this.token = null;

    // storage sync
    this.storage.remove(StorageSyncKey.Token);
  }
}
