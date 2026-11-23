import { AxiosPromise, AxiosResponse } from 'axios';
import { UserSignupRequestParams } from '../types';
import request$ from '../providers/rest.provider';
import { AuthSessionResponse } from '../model';
import { CommunicationSettings } from '../services';

/**
 * Registers a new account. The BE API answers 422 `must_verify_email` when the
 * registration is accepted: the account is confirmed from the emailed link.
 */
const signup = (data: UserSignupRequestParams):
  AxiosPromise<AuthSessionResponse> => request$('api/user/register', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data,
}).then((r: AxiosResponse<AuthSessionResponse>) => {
  if (r.data?.csrf_token) {
    CommunicationSettings.csrfToken = r.data.csrf_token;
  }
  return r;
});

export default signup;
