import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { SearchAnnotationParams, SearchAnnotationResults } from '../model';
import { CommunicationSettings } from '../services';

const publicSearch = (data: SearchAnnotationParams): AxiosPromise<SearchAnnotationResults> => request$('/annotation/search',
  {
    baseURL: CommunicationSettings.apiBaseUrl,
    method: 'post',
    data,
    skipAuth: true
  });
export default publicSearch;
