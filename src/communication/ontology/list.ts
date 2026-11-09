import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { OntologyListResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const list = (): AxiosPromise<OntologyListResponse> => request$('/ontologies', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get',
  hooks: {
    after: refreshHook
  }
});
export default list;
