import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { OntologyListResponse } from '../model';
import { CommunicationSettings } from '../services';

const list = (): AxiosPromise<OntologyListResponse> => request$('/ontologies', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'get'
});
export default list;
