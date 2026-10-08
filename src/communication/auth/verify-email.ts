import { AxiosPromise } from 'axios';
import { SuccessVerifyEmailResponse } from '../model';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

const verifyMail = (): AxiosPromise<SuccessVerifyEmailResponse> => request$('api/auth/resend_verification_mail', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'get',
  withCredentials: true
});

export default verifyMail;
