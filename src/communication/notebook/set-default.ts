import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { Notebook } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const setDefault = (id: string): AxiosPromise<Notebook> => request$(`/api/auth/edit_current_notebook/${id}`, {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'get',
  hooks: {
    after: refreshHook
  }
});
export default setDefault;
