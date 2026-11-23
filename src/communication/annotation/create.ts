import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, AnnotationAttributes } from '../model';
import { CommunicationSettings } from '../services';
import { withoutFields } from '../providers/without-fields';

const create = (data: AnnotationAttributes): AxiosPromise<UpdateResponse> => request$('/annotation', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data: withoutFields(data, 'userId'),
});
export default create;
