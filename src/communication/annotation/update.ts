import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { AnnotationAttributes, UpdateResponse } from '../model';
import { CommunicationSettings } from '../services';
import { withoutFields } from '../providers/without-fields';

const update = (id: string, data: AnnotationAttributes): AxiosPromise<UpdateResponse> => request$(`/annotation/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data: withoutFields(data, 'userId'),
});
export default update;
