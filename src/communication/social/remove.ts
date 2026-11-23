import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';
import { withoutFields } from '../providers/without-fields';
import { SocialAttributes, UpdateResponse } from '..';
/**
 * Removes an annotation
 * @returns null
*/
const remove = (data: SocialAttributes): AxiosPromise<UpdateResponse> => request$('/social/undo', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data: withoutFields(data, 'userId'),
});
export default remove;
