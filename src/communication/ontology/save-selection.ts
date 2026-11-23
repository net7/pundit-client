import { AxiosPromise } from 'axios';
import request$ from '../providers/rest.provider';
import { OntologySelectionRequest, OntologySelectionResponse } from '../model';
import { CommunicationSettings } from '../services';

const saveSelection = (
  data: OntologySelectionRequest
): AxiosPromise<OntologySelectionResponse> => request$('/ontologies/selection', {
  baseURL: CommunicationSettings.apiBaseUrl,
  method: 'put',
  data
});
export default saveSelection;
