import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, ReplyAttributes } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const create = (data: ReplyAttributes): AxiosPromise<UpdateResponse> => request$('/reply', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default create;
