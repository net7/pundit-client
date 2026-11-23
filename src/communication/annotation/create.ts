import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, AnnotationAttributes } from '../model';
import { CommunicationSettings } from '../services';

const create = (data: AnnotationAttributes): AxiosPromise<UpdateResponse> => request$('/annotation', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default create;
