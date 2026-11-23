import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Social } from '../model';
import { CommunicationSettings } from '../services';

const get = (id: string): AxiosPromise<Social> => request$(`/social/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get'
});
export default get;
