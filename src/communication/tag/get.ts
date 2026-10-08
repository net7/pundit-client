import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Tag } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const get = (): AxiosPromise<Tag[]> => request$('/tag', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get',
  hooks: {
    after: refreshHook
  }
});
export default get;
