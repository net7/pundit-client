import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Tag } from '../model';
import { CommunicationSettings } from '../services';

const get = (): AxiosPromise<Tag[]> => request$('/tag', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get'
});
export default get;
