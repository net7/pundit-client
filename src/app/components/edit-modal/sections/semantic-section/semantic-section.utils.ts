import { OntologyElement, ObjectUriElementType, UriRdfTypes } from 'src/communication';
import { getOntologySourceLabel } from 'src/app/services/ontology.service';
import { SemanticItem } from 'src/app/types';

export const DEFAULT_PROVIDER_ID = 'pundit-basic';

/** Minimum length of the text that triggers a predicate search. */
export const PREDICATE_SEARCH_MIN_LENGTH = 1;

/** Minimum length of the text that triggers an object search. */
export const OBJECT_SEARCH_MIN_LENGTH = 1;

export type SemanticObjectType = 'literal' | 'uri';

export type SemanticPredicateOption = {
  label: string;
  value: string;
  sourceLabel?: string;
  selected?: boolean;
};

/** Object picked from the autocomplete (or reopened from a saved `search` URI). */
export type SemanticPickedObject = {
  uri: string;
  label: string;
  elementType?: ObjectUriElementType;
  rdfTypes?: UriRdfTypes[];
};

export type SemanticFormRow = {
  id: number;
  predicate: {
    label: string;
    /** Predicates of the selected ontologies matching `query`. */
    remote: SemanticPredicateOption[];
    /** The selected predicate (picked from the search, or stored in the triple). */
    picked: SemanticItem | null;
    /** A search answered for the current query (to tell "no results" from "not searched"). */
    searched: boolean;
    query: string;
    isExpanded: boolean;
    /** A search of the ontology predicates is in progress. */
    isLoading: boolean;
  };
  object: {
    value: string | null;
    providerId: string;
    type?: SemanticObjectType;
    placeholder?: string;
    altValue?: string | null;
    picked: SemanticPickedObject | null;
    options: OntologyElement[];
    isExpanded: boolean;
    isLoading: boolean;
  };
  actions: {
    isExpanded: boolean;
  };
  disabled?: boolean;
  /** The stored triple, kept while the user does not edit the row. */
  _raw?: any;
};

/** Value of one semantic row, as read by `EditModalPayloadBuilder`. */
export type SemanticRowValue = {
  predicate: SemanticItem;
  object: SemanticItem | (SemanticPickedObject & { source: 'search' });
  objectType: SemanticObjectType;
  _raw?: any;
};

export const getObjectType = (value: string | null): SemanticObjectType => {
  const regex = /^(http:|https:|urn:|mailto:|file:)/g;
  if (
    (typeof value === 'string')
    && value.match(regex)) {
    return 'uri';
  }
  return 'literal';
};

export const toPredicateOption = (element: OntologyElement): SemanticPredicateOption => ({
  label: element.label,
  value: element.uri,
  sourceLabel: getOntologySourceLabel(element.ontology),
});

/**
 * Options shown in the predicate dropdown: only the predicates of the selected
 * ontologies found for the text typed, the selected one marked.
 */
export const getPredicateOptions = (row: SemanticFormRow): SemanticPredicateOption[] => {
  const { remote, picked } = row.predicate;
  return remote.map((option) => ({ ...option, selected: option.value === picked?.uri }));
};

/** Predicate currently selected in the row, or null. */
export const getSelectedPredicate = (row: SemanticFormRow): SemanticItem | null => row.predicate.picked;

/** Label of the type indicator of the object input. */
export const getObjectIndicator = (row: SemanticFormRow): string => {
  const { picked, altValue, type } = row.object;
  if (picked) {
    return picked.elementType || altValue || 'uri';
  }
  return altValue || type || 'literal';
};

/**
 * Builds the form value of one row, or null when the row is incomplete.
 * An unedited row keeps its stored triple in `_raw`.
 */
export const getRowValue = (row: SemanticFormRow): SemanticRowValue | null => {
  const predicate = getSelectedPredicate(row);
  if (row._raw) {
    return {
      predicate: predicate as SemanticItem,
      object: { label: row.object.value || '', uri: row.object.picked?.uri || '' },
      objectType: row.object.picked ? 'uri' : (row.object.type || 'literal'),
      _raw: row._raw,
    };
  }
  if (!predicate) {
    return null;
  }
  const { picked, value } = row.object;
  if (picked) {
    return {
      predicate,
      objectType: 'uri',
      object: { ...picked, source: 'search' },
    };
  }
  if (!value) {
    return null;
  }
  return {
    predicate,
    objectType: getObjectType(value),
    object: { label: value, uri: null as unknown as string },
  };
};
