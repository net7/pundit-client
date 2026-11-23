import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { SearchAnnotationParams, SearchAnnotationResults } from '../model';
import { CommunicationSettings } from '../services';

const search = (data: SearchAnnotationParams): AxiosPromise<SearchAnnotationResults> => request$('/annotation/search', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default search;
