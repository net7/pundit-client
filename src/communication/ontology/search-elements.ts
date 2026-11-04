import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { OntologySearchRequest, OntologySearchResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

export const DEFAULT_SEARCH_LIMIT = 20;

const searchElements = (
  { query, categories, limit = DEFAULT_SEARCH_LIMIT }: OntologySearchRequest
): AxiosPromise<OntologySearchResponse> => request$('/ontologies/elements', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get',
  params: {
    q: query,
    categories: categories.join(','),
    limit,
  },
  hooks: {
    after: refreshHook
  }
});
export default searchElements;
