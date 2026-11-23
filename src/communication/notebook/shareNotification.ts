import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { CommunicationSettings } from '../services';

const shareNotification = (id: string, data: {email: string}): AxiosPromise<any> => request$(`/notebook/${id}/notifyShare`, {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});

export default shareNotification;
