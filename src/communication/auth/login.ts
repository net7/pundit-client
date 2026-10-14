import { AxiosPromise, AxiosResponse } from 'axios';
import { UserLoginRequestParams } from '../types';
import request$ from '../providers/rest.provider';
import { SuccessLoginResponse } from '../model';
import { CommunicationSettings } from '../services';

const login = (data: UserLoginRequestParams):
  AxiosPromise<SuccessLoginResponse> => request$('api/auth/login', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data,
  withCredentials: true
}).then((r: AxiosResponse<SuccessLoginResponse>) => {
  CommunicationSettings.token = r.data.token;
  return r;
}).catch((e) => {
  CommunicationSettings.token = null;
  throw e;
});

export default login;
