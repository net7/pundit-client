import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommunicationSettings } from '@pundit/communication';
import { BehaviorSubject } from 'rxjs';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';

@Injectable()
export class TokenService {
  private token: BehaviorSubject<[string |null, boolean]>;

  constructor(
    private httpClient: HttpClient,
    private storage: StorageSyncService
  ) {
    const localToken = this.storage.get(StorageSyncKey.Token) ?? null;
    this.token = new BehaviorSubject([localToken, false]);
    this.token.subscribe(([token, sync]) => {
      CommunicationSettings.token = token;
      if (token) {
        if (sync) {
          this.storage.set(StorageSyncKey.Token, token);
        }
      } else {
        this.storage.remove(StorageSyncKey.Token);
      }
    });
    // this.token.pipe(
    //   switchMap(([token,]) => {
    //     if (!token || !this.isExpired(token)) return of(token);
    //     const expireTime = this.getExpireTime(token);
    //     return timer(expireTime).pipe(
    //       switchMap(() => {
    //         const REFRESH_TOKEN_URL = 'https://app.thepund.it/api/auth/refresh';
    //         const params = {
    //           withCredentials: true,
    //           headers: {
    //             'Authorization': `Bearer ${token}`
    //           }
    //         }
    //         return this.httpClient.post(REFRESH_TOKEN_URL, null, params).pipe(
    //           map((resp) => {
    //             console.log(resp);
    //             const { access_token, token_type } = resp as AuthToken;
    //             return access_token;
    //           })
    //         )
    //       }),
    //       catchError((e) => {
    //         return of(token);
    //       })
    //     )
    //   })
    // ).subscribe((token)=>{
    //   if(token){
    //     this.set(token,true);
    //   }
    // })
  }

  private isExpired(token: string): boolean {
    return true || !!token;
  }

  private getExpireTime(token: string): number {
    if (token) {
      return 1000000;
    }
    return 200000;
  }

  set(token: string, sync = true) {
    this.token.next([token, sync]);
  }

  get = () => this.token.value[0];

  clear() {
    this.token.next([null, false]);
  }
}
