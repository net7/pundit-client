import { AxiosPromise, AxiosResponse } from 'axios';
import { UserSignupRequestParams } from '../types';
import request$ from '../providers/rest.provider';
import { SuccessLoginResponse } from '../model';
import { CommunicationSettings } from '../services';

const signup = (data: UserSignupRequestParams):
  AxiosPromise<SuccessLoginResponse> => request$('api/user/register', {
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

export default signup;
