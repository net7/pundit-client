import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { SearchNotebookParams, SearchNotebookResults } from '../model';
import { CommunicationSettings } from '../services';

const search = (data: SearchNotebookParams): AxiosPromise<SearchNotebookResults> => request$('/notebook/search', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'post',
  data
});
export default search;
