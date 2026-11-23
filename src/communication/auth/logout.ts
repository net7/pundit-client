import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

/**
 * Signs out. The CSRF token belonged to the closed session, so it is dropped
 * and the next write fetches a new one.
 */
const logout = (): AxiosPromise<null> => request$('api/auth/logout', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data: null,
}).finally(() => {
  CommunicationSettings.csrfToken = null;
});

export default logout;
