import { Injectable } from '@angular/core';
import { CommunicationSettings } from '@pundit/communication';
import { Subject } from 'rxjs';
import { StorageService } from './storage-service/storage.service';
import { StorageKey } from './storage-service/storage.types';

@Injectable()
export class TokenService {
  public ready$: Subject<void> = new Subject();

  private token: string;

  constructor(
    private storage: StorageService
  ) {
    this.storage.get(StorageKey.Token).subscribe((token: string) => {
      if (token) {
        this.set(token, false);
      }
      // emit signal
      this.ready$.next();
    });
  }

  set(token: string, sync = true) {
    this.token = token;
    // storage sync
    if (sync) {
      this.storage.set(StorageKey.Token, token);
    }
    // add token to communication
    CommunicationSettings.token = token;
  }

  get = () => this.token;

  clear() {
    this.token = null;
    // storage sync
    this.storage.remove(StorageKey.Token);
    // remove token from communication
    CommunicationSettings.token = null;
  }
}
