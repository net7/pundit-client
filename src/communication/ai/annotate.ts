import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { AiAnnotateRequest, AiAnnotateResponse } from '../model';
import { CommunicationSettings } from '../services';

const annotate = (data: AiAnnotateRequest): AxiosPromise<AiAnnotateResponse> => request$('/ai/annotate', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default annotate;
