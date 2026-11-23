import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, SocialAttributes } from '../model';
import { CommunicationSettings } from '../services';
import { withoutFields } from '../providers/without-fields';

const create = (data: SocialAttributes): AxiosPromise<UpdateResponse> => request$('/social/do', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data: withoutFields(data, 'userId'),
});
export default create;
