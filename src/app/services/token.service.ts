import { Injectable } from '@angular/core';
import { CommunicationSettings, retry$ } from '@pundit/communication';
import { PunditRefreshTokenService, RefreshResponse } from '@pundit/login';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';

@Injectable()
export class TokenService {
  private token: any;

  constructor(
    private storage: StorageSyncService,
    private punditRefreshToken: PunditRefreshTokenService
  ) {
    const token = this.storage.get(StorageSyncKey.Token);
    if (token) {
      this.set(JSON.parse(token), false);
    }
    CommunicationSettings.hooks = {
      after: this.afterHook,
      before: this.beforeHook
    };
  }

  set(token: any, sync = true) {
    this.token = token;
    // storage sync
    if (sync) {
      this.storage.set(StorageSyncKey.Token, JSON.stringify(token));
    }
    // add token to communication
    CommunicationSettings.token = (token && token.access_token) || null;
  }

  get = () => this.token;

  clear() {
    this.token = null;
    // storage sync
    this.storage.remove(StorageSyncKey.Token);
    // remove token from communication
    CommunicationSettings.token = null;
  }

  private beforeHook = (options) => {
    this.set(this.token, false);
    return options;
  }

  private afterHook = (response) => response
    .then((r) => r)
    .catch((err) => {
      const { status } = err.response;
      if (status !== 401) {
        return err;
      }
      const token = this.get();
      return this.punditRefreshToken.refresh(token.access_token).toPromise()
        .then(
          (refreshResponse: RefreshResponse) => {
            if ('error' in refreshResponse) {
              throw err;
            } else {
              const newToken = refreshResponse.token;
              this.set(newToken);
              return retry$(err);
            }
          }
        ).catch(() => { throw err; });
    })
}
