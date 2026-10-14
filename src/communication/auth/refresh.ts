import { AxiosError, AxiosPromise } from 'axios';
import { AuthToken } from '../model';
import request$, { retry$ } from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

const refreshToken = ():
  AxiosPromise<AuthToken> => request$('api/auth/refresh', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data: null,
  withCredentials: true
});

const refreshTokenAndRetry = (err: AxiosError): AxiosPromise => refreshToken()
  .then((refreshResponse) => {
    const { data } = refreshResponse;
    const { access_token, expires_in, token_type } = data;
    CommunicationSettings.token = { access_token, expires_in, token_type };
    return retry$(err);
  }).catch((retryErr) => { CommunicationSettings.token = null; throw retryErr; });

export const refreshHook = (response: AxiosPromise): AxiosPromise => response
  .then((r) => r)
  .catch((err) => {
    const { status } = err.response;
    if (status === 401) {
      return refreshTokenAndRetry(err);
    }
    throw err;
  });

export default refreshToken;
