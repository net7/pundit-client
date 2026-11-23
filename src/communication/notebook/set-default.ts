import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

const setDefault = (id: string): AxiosPromise<null> => request$(`api/auth/edit_current_notebook/${id}`, {
  baseURL: CommunicationSettings.authBaseUrl,
  method: 'post',
  data: null,
});
export default setDefault;
