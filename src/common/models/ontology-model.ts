import {
  ontology, OntologySearchRequest, OntologySelectionRequest
} from 'src/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class OntologyModel {
  @CrossMessage(CrossMsgRequestId.OntologyList)
  static list() {
    return ontology.list();
  }

  @CrossMessage(CrossMsgRequestId.OntologySaveSelection)
  static saveSelection(data: OntologySelectionRequest) {
    return ontology.saveSelection(data);
  }

  @CrossMessage(CrossMsgRequestId.OntologySearchElements)
  static searchElements(data: OntologySearchRequest) {
    return ontology.searchElements(data);
  }
}
