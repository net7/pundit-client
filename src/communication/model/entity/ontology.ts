export type OntologyElementCategory = 'predicate' | 'class' | 'entity';

/**
 * One of the user's ready ontologies, as listed in the Ontologies panel.
 */
export interface OntologySummary {
  id: string;
  name: string;
  /** Preferred namespace prefix (e.g. "foaf"), when the ontology declares one. */
  prefix?: string;
  /** Shared ontology provided by Pundit: owned by no user, cannot be deleted or edited. */
  shared?: boolean;
  counts: Record<OntologyElementCategory, number>;
  /** Whether the ontology is active in the annotator (= selectedCategories is not empty). */
  selected: boolean;
  /** Categories of the ontology used in the annotator; empty when it is not selected. */
  selectedCategories: OntologyElementCategory[];
}

/** One active ontology and the categories it is used for. */
export interface OntologySelection {
  id: string;
  categories: OntologyElementCategory[];
}

/**
 * An element (predicate, class or entity) found in the user's selected ontologies.
 */
export interface OntologyElement {
  uri: string;
  label: string;
  category: OntologyElementCategory;
  description?: string;
  ontology: {
    name: string;
    prefix?: string;
  };
}
