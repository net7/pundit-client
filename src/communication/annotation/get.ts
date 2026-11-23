import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Annotation } from '../model';
import { CommunicationSettings } from '../services';

const get = (id: string): AxiosPromise<Annotation> => request$(`/annotation/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get'
});
export default get;
