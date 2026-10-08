import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { AiAnnotateRequest, AiAnnotateResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const annotate = (data: AiAnnotateRequest): AxiosPromise<AiAnnotateResponse> => request$('/ai/annotate', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default annotate;
