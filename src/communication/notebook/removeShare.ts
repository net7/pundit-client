import { AxiosPromise } from 'axios';
import { UpdateResponse } from '../model';
import { CommunicationSettings } from '../services';
import request$ from '../providers/rest.provider';

const removeShare = (id: string, data: {email: string}): AxiosPromise<UpdateResponse> => request$(`/notebook/${id}/removeShare`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default removeShare;
