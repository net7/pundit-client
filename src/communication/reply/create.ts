import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, ReplyAttributes } from '../model';
import { CommunicationSettings } from '../services';

const create = (data: ReplyAttributes): AxiosPromise<UpdateResponse> => request$('/reply', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default create;
