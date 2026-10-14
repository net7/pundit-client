import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, SocialAttributes } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const create = (data: SocialAttributes): AxiosPromise<UpdateResponse> => request$('/social/do', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default create;
