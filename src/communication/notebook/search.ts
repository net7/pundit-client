import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { SearchNotebookParams, SearchNotebookResults } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const search = (data: SearchNotebookParams): AxiosPromise<SearchNotebookResults> => request$('/notebook/search', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data,
  hooks: {
    after: refreshHook
  }
});
export default search;
