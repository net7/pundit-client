import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, NotebookAttributes } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const create = (data: NotebookAttributes): AxiosPromise<UpdateResponse> => request$('/notebook', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default create;
