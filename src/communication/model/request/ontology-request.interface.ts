import { OntologyElementCategory, OntologySelection } from '../entity/ontology';

export type OntologySelectionRequest = {
  /** The whole selection: an ontology not listed is not selected. */
  ontologies: OntologySelection[];
}

export type OntologySearchRequest = {
  query: string;
  categories: OntologyElementCategory[];
  limit?: number;
}
