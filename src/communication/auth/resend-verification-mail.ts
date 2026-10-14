import { AxiosPromise } from 'axios';
import { UserLoginRequestParams } from '../types';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

/**
 * Sends a new email confirmation link. The credentials prove the caller is the
 * registrant, so no token is sent and a 401 means wrong credentials: no refresh hook.
 */
const resendVerificationMail = (data: UserLoginRequestParams):
  AxiosPromise<void> => request$('api/auth/resend_verification_mail', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data,
  skipAuth: true
});

export default resendVerificationMail;
