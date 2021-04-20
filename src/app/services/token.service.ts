import { Injectable } from '@angular/core';
import { CommunicationSettings } from '@pundit/communication';
import { PunditRefreshTokenService } from '@pundit/login';
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
      this.set(token, false);
    }
    CommunicationSettings.hooks = {
      // after: (options,response: AxiosPromise)=> {
      //   return response
      //   .then(r => r)
      //   .catch((error: AxiosError) =>{
      //     const { status } = error.response;
      //     if(status !== 401){
      //       return error;
      //     }

      //     return this.punditRefreshToken.refresh('abc').toPromise().then(
      //       (refreshResponse: RefreshResponse) => {
      //         if('error' in refreshResponse ){
      //           return error;
      //         }else{
      //           const newToken = refreshResponse.token;
      //           this.set(newToken);
      //           error.config.headers['authorization'] = `Bearer ${newToken.access_token}`;
      //           return axios(error.config);
      //         }
      //       }
      //     ).catch(
      //       (refreshError)=>{
      //         return error;
      //       }
      //     )
      //   })
      // },
      before: (options) => {
        if (this?.token?.access_token) {
          options.headers = options.headers || {};
          options.headers.Authorization = `Bearer ${this.token.access_token}`;
        }
        return options;
      }
    };
  }

  set(token: any, sync = true) {
    this.token = token;
    // storage sync
    if (sync) {
      this.storage.set(StorageSyncKey.Token, JSON.stringify(token));
    }
    // add token to communication
    CommunicationSettings.token = token;
  }

  get = () => this.token;

  clear() {
    this.token = null;
    // storage sync
    this.storage.remove(StorageSyncKey.Token);
    // remove token from communication
    CommunicationSettings.token = null;
  }
}
