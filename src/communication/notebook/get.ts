import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Notebook } from '../model';
import { CommunicationSettings } from '../services';

const get = (id: string): AxiosPromise<Notebook> => request$(`/notebook/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get'
});
export default get;
