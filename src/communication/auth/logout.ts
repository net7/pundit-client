import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';
import { refreshHook } from './refresh';

const logout = (): AxiosPromise<null> => request$('api/auth/logout', {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'get',
  withCredentials: true,
  hooks: {
    after: refreshHook
  },
}).then((r) => {
  CommunicationSettings.token = null;
  return r;
}).catch((e) => {
  CommunicationSettings.token = null;
  throw e;
});

export default logout;
