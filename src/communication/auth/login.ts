import { AxiosPromise, AxiosResponse } from 'axios';
import { UserLoginRequestParams } from '../types';
import request$ from '../providers/rest.provider';
import { AuthSessionResponse } from '../model';
import { CommunicationSettings } from '../services';

const login = (data: UserLoginRequestParams):
  AxiosPromise<AuthSessionResponse> => request$('api/auth/login', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data,
}).then((r: AxiosResponse<AuthSessionResponse>) => {
  // the sign-in starts a new session, bound to a new token
  if (r.data?.csrf_token) {
    CommunicationSettings.csrfToken = r.data.csrf_token;
  }
  return r;
});

export default login;
