import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Annotation } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const get = (id: string): AxiosPromise<Annotation> => request$(`/annotation/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get',
  hooks: {
    after: refreshHook
  }
});
export default get;
