import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';
/**
 * Removes an annotation
 * @returns null
*/
const remove = (id: string): AxiosPromise<null> => request$(`/annotation/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'delete',
  hooks: {
    after: refreshHook
  }
});
export default remove;
