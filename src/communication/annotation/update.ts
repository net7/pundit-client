import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { AnnotationAttributes, UpdateResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const update = (id: string, data: AnnotationAttributes): AxiosPromise<UpdateResponse> => request$(`/annotation/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data,
  hooks: {
    after: refreshHook
  }
});
export default update;
