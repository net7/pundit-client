import { AxiosPromise, AxiosResponse } from 'axios';
import { SuccessLoginResponse } from '../model';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

const sso = (): AxiosPromise<SuccessLoginResponse> => {
  let promiseResolve: (value?: unknown) => void;
  const p = new Promise((resolve) => {
    promiseResolve = resolve;
  });
  ConnectionManager.ssoLoading$ = p;
  return request$('/api/auth/me', {
    method: 'post',
    baseURL: CommunicationSettings.authBaseUrl,
    data: null,
    withCredentials: true
  }, p).then((resp: AxiosResponse<any>) => {
    const { data } = resp;
    const { access_token, expires_in, token_type } = data;
    CommunicationSettings.token = { access_token, expires_in, token_type };
    return resp;
  }).catch((err) => {
    CommunicationSettings.token = null;
    throw err;
  }).finally(() => {
    promiseResolve();
  });
};

export default sso;
