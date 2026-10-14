import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, ReplyAttributes } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const update = (id: string, data: ReplyAttributes): AxiosPromise<UpdateResponse> => request$(`/reply/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data,
  hooks: {
    after: refreshHook
  }
});
export default update;
