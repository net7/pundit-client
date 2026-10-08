import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';
import { SocialAttributes, UpdateResponse } from '..';
/**
 * Removes an annotation
 * @returns null
*/
const remove = (data: SocialAttributes): AxiosPromise<UpdateResponse> => request$('/social/undo', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default remove;
