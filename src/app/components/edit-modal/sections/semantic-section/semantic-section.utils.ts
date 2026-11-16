import { OntologyElement, ObjectUriElementType, UriRdfTypes } from 'src/communication';
import { getOntologySourceLabel } from 'src/app/services/ontology.service';
import { SemanticItem } from 'src/app/types';

export const DEFAULT_PROVIDER_ID = 'pundit-basic';

/** Minimum length of the text that triggers a predicate search. */
export const PREDICATE_SEARCH_MIN_LENGTH = 1;

/** Predicates listed when the predicate field opens empty. */
export const PREDICATE_DEFAULT_LIMIT = 10;

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
  /** Subject group the row belongs to. */
  groupId: number;
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

/**
 * Subject of a group, as stored in the triples: an ontology element picked from the
 * search (`source: 'search'`) or a hand-typed URI (`source: 'free-text'`).
 */
export type SemanticSubject = {
  uri: string;
  label: string;
  source?: 'search' | 'free-text';
  elementType?: ObjectUriElementType;
  description?: string;
};

/** Key of a subject: `'fragment'` for the annotated selection, the element URI otherwise. */
export const FRAGMENT_SUBJECT_KEY = 'fragment';

/**
 * A run of consecutive rows sharing the same subject. The subject is either the
 * annotated fragment ("Selection") or an ontology element picked from the search.
 */
export type SemanticSubjectGroup = {
  id: number;
  subject: {
    /** The subject is the annotated fragment. */
    isFragment: boolean;
    /** Element picked as subject (null for the fragment or when not chosen yet). */
    picked: SemanticSubject | null;
    query: string;
    options: OntologyElement[];
    /** A search answered for the current query. */
    searched: boolean;
    isExpanded: boolean;
    isLoading: boolean;
  };
  /** Subject key the group was loaded with (undefined for a new group). */
  storedKey?: string;
};

/** Value of one semantic row, as read by `EditModalPayloadBuilder`. */
export type SemanticRowValue = {
  predicate: SemanticItem;
  object: SemanticItem | (SemanticPickedObject & { source: 'search' });
  objectType: SemanticObjectType;
  /** Subject of the row's group; absent for the fragment. */
  subject?: SemanticSubject & { source: 'search' | 'free-text' };
  /** The group subject differs from the one the stored triple was loaded with. */
  subjectChanged?: boolean;
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
 * ontologies found for the text typed (or the first ones when nothing is typed),
 * the selected one marked.
 */
export const getPredicateOptions = (
  row: SemanticFormRow, defaults: SemanticPredicateOption[] = []
): SemanticPredicateOption[] => {
  const { query, remote, picked } = row.predicate;
  // an empty field lists the first predicates, shared by all rows
  const options = query.trim() ? remote : defaults;
  return options.map((option) => ({ ...option, selected: option.value === picked?.uri }));
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

/** Subject of a group from a stored subject; null for the fragment. */
export const toSemanticSubject = (subject?: Partial<SemanticSubject> | null): SemanticSubject | null => {
  if (!subject?.uri) return null;
  const { uri, label, source, elementType, description } = subject;
  return {
    uri,
    label: label || uri,
    ...(source ? { source } : {}),
    ...(elementType ? { elementType } : {}),
    ...(description ? { description } : {}),
  };
};

/** Subject key of a stored subject (undefined/null = the fragment). */
export const getSubjectKey = (subject?: { uri?: string } | null): string => subject?.uri || FRAGMENT_SUBJECT_KEY;

/** Subject key of a group, or null when its subject is not chosen yet. */
export const getGroupSubjectKey = (group: SemanticSubjectGroup): string | null => {
  if (group.subject.isFragment) return FRAGMENT_SUBJECT_KEY;
  return group.subject.picked ? group.subject.picked.uri : null;
};

/**
 * Splits the stored subjects into runs of consecutive equal subjects, keeping
 * their order: `S1 S1 S2 S1` gives `[0, 0, 1, 2]` (group index of each triple)
 * and the subject of each run.
 */
export const toSubjectRuns = <T extends { uri?: string }>(
  subjects: (T | null | undefined)[]
): { runs: (T | null)[]; indexes: number[] } => {
  const runs: (T | null)[] = [];
  const indexes: number[] = [];
  let lastKey: string | null = null;
  subjects.forEach((subject) => {
    const key = getSubjectKey(subject);
    if (key !== lastKey) {
      runs.push(subject?.uri ? subject : null);
      lastKey = key;
    }
    indexes.push(runs.length - 1);
  });
  return { runs, indexes };
};

/**
 * Adds the group subject to a row value; null when the group has no subject yet
 * (its triples are not saved).
 */
export const withGroupSubject = (
  value: SemanticRowValue, group: SemanticSubjectGroup
): SemanticRowValue | null => {
  const key = getGroupSubjectKey(group);
  if (!key) return null;
  const { picked } = group.subject;
  return {
    ...value,
    ...(picked && !group.subject.isFragment
      ? { subject: { ...picked, source: picked.source || 'search' as const } }
      : {}),
    ...(value._raw && group.storedKey !== key ? { subjectChanged: true } : {}),
  };
};

/** Form value of the section: rows in display order, each with its group subject. */
export const getGroupsValue = (
  rows: SemanticFormRow[], groups: SemanticSubjectGroup[]
): SemanticRowValue[] => groups.reduce((values, group) => {
  rows.filter(({ groupId }) => groupId === group.id).forEach((row) => {
    const value = getRowValue(row);
    const withSubject = value ? withGroupSubject(value, group) : null;
    if (withSubject) values.push(withSubject);
  });
  return values;
}, [] as SemanticRowValue[]);
