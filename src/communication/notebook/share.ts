import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { NotebookPermissions, UpdateResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const share = (id: string, data: NotebookPermissions): AxiosPromise<UpdateResponse> => request$(`/notebook/${id}/share`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default share;
