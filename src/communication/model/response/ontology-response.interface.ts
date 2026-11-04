import { OntologyElement, OntologySelection, OntologySummary } from '../entity/ontology';

export interface OntologyListResponse {
  data: OntologySummary[];
}

export interface OntologySelectionResponse {
  data: { ontologies: OntologySelection[] };
}

export interface OntologySearchResponse {
  data: OntologyElement[];
}
