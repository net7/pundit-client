import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { NotebookPermissions, UpdateResponse } from '../model';
import { CommunicationSettings } from '../services';

const share = (id: string, data: NotebookPermissions): AxiosPromise<UpdateResponse> => request$(`/notebook/${id}/share`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default share;
