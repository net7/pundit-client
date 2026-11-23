import { AxiosPromise, AxiosResponse } from 'axios';
import { AuthSessionResponse } from '../model';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

/**
 * Asks the BE API who is signed in with the session cookie (`GET api/user`).
 * Other requests wait for it through `ConnectionManager.ssoLoading$`.
 */
const sso = (): AxiosPromise<AuthSessionResponse> => {
  let promiseResolve: (value?: unknown) => void;
  const p = new Promise((resolve) => {
    promiseResolve = resolve;
  });
  ConnectionManager.ssoLoading$ = p;
  return request$('api/user', {
    method: 'get',
    baseURL: CommunicationSettings.authBaseUrl,
  }, p).then((resp: AxiosResponse<AuthSessionResponse>) => {
    if (resp.data?.csrf_token) {
      CommunicationSettings.csrfToken = resp.data.csrf_token;
    }
    return resp;
  }).finally(() => {
    promiseResolve();
  });
};

export default sso;
