import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, NotebookAttributes } from '../model';
import { CommunicationSettings } from '../services';

const create = ({ label, sharingMode }: NotebookAttributes): AxiosPromise<UpdateResponse> => request$('/notebook', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  // sharing goes only through the share, removeShare and notifyShare routes
  data: { label, sharingMode },
});
export default create;
