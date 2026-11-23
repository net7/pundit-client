import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { UpdateResponse, NotebookAttributes } from '../model';
import { CommunicationSettings } from '../services';

const update = (id: string, { label, sharingMode }: NotebookAttributes): AxiosPromise<UpdateResponse> => request$(`/notebook/${id}`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  // sharing goes only through the share, removeShare and notifyShare routes
  data: { label, sharingMode },
});
export default update;
