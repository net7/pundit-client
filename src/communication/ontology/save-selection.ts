import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { OntologySelectionRequest, OntologySelectionResponse } from '../model';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

const saveSelection = (
  data: OntologySelectionRequest
): AxiosPromise<OntologySelectionResponse> => request$('/ontologies/selection', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data,
  hooks: {
    after: refreshHook
  }
});
export default saveSelection;
