import { Injectable } from '@angular/core';
import { CommunicationSettings, retry$ } from '@pundit/communication';
import { AuthToken, PunditRefreshTokenService, LoginResponse } from 'src/app/login-module/public-api';
import { of, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StorageService } from './storage-service/storage.service';
import { StorageKey } from '../../common/types';

@Injectable()
export class TokenService {
  public ready$: ReplaySubject<void> = new ReplaySubject();

  private token: AuthToken;

  constructor(
    private storage: StorageService,
    private punditRefreshToken: PunditRefreshTokenService
  ) {
    this.storage.get(StorageKey.Token).subscribe((token: AuthToken) => {
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

  set(token: AuthToken, sync = true) {
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
    switchMap((token: AuthToken) => {
      if (!this.equals(token)) {
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
      return this.refreshTokenAndRetry(err);
    })

  private refreshTokenAndRetry = (err) => {
    const options = {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${this.token?.access_token}`
      }
    };
    return this.punditRefreshToken.refresh(options).toPromise()
      .then((refreshResponse: LoginResponse) => {
        if ('error' in refreshResponse) {
          throw err;
        } else {
          this.set(refreshResponse.token);
          return retry$(err);
        }
      }).catch(() => { throw err; });
  }

  private equals(token: AuthToken): boolean {
    return token?.access_token === this.token?.access_token;
  }
}
