import { Injectable } from '@angular/core';
import { CommunicationSettings, retry$ } from '@pundit/communication';
import { PunditRefreshTokenService, RefreshResponse } from '@pundit/login';
import { of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StorageService } from './storage-service/storage.service';
import { StorageKey } from './storage-service/storage.types';

@Injectable()
export class TokenService {
  public ready$: Subject<void> = new Subject();

  private token: any;

  constructor(
    private storage: StorageService,
    private punditRefreshToken: PunditRefreshTokenService
  ) {
    this.storage.get(StorageKey.Token).subscribe((token: object) => {
      if (token) {
        this.set(token, false);
      }
      // emit signal
      this.ready$.next();
    });
    CommunicationSettings.hooks = {
      after: this.afterHook,
      before: this.beforeHook
    };
  }

  set(token: any, sync = true) {
    this.token = token;
    // storage sync
    if (sync) {
      this.storage.set(StorageKey.Token, token);
    }
    // add token to communication
    CommunicationSettings.token = (token && token.access_token) || null;
  }

  get = () => this.token;

  clear() {
    this.token = null;
    // storage sync
    this.storage.remove(StorageKey.Token);
    // remove token from communication
    CommunicationSettings.token = null;
  }

  private beforeHook = (options) => this.storage.get(StorageKey.Token).pipe(
    switchMap((token) => {
      if (token !== this.token) {
        this.set(token, false);
      }
      return of(options);
    })
  ).toPromise()

  private afterHook = (response) => response
    .then((r) => r)
    .catch((err) => {
      const { status } = err.response;
      if (status !== 401) {
        return err;
      }
      return this.punditRefreshToken.refresh(this.token.access_token).toPromise()
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
