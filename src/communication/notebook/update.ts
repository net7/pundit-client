import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, NotebookAttributes } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const update = (id: string, data: NotebookAttributes): AxiosPromise<UpdateResponse> => request$(`/notebook/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data,
  hooks: {
    after: refreshHook
  }
});
export default update;
