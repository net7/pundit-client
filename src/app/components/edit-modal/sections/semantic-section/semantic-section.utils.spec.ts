import {
  SemanticFormRow, getObjectIndicator, getPredicateOptions, getRowValue
} from './semantic-section.utils';

const row = (overrides: Partial<SemanticFormRow> = {}): SemanticFormRow => ({
  id: 1,
  predicate: {
    label: '', remote: [], picked: null, searched: false, query: '', isExpanded: false, isLoading: false
  },
  object: {
    value: null, providerId: 'pundit-basic', type: 'literal', picked: null, options: [], isExpanded: false, isLoading: false
  },
  actions: { isExpanded: false },
  ...overrides,
});

const knows = { label: 'knows', uri: 'http://foaf/knows' };

describe('getPredicateOptions', () => {
  it('lists only the ontology results, the selected one marked', () => {
    const current = row();
    const options = getPredicateOptions({
      ...current,
      predicate: {
        ...current.predicate,
        query: 'kn',
        picked: knows,
        remote: [
          { label: 'knows', value: 'http://foaf/knows', sourceLabel: 'foaf' },
          { label: 'knownFor', value: 'http://onto/knownFor', sourceLabel: 'onto' },
        ],
      },
    });
    expect(options.map(({ label, selected }) => [label, selected])).toEqual([['knows', true], ['knownFor', false]]);
  });

  it('is empty without a search', () => {
    expect(getPredicateOptions(row())).toEqual([]);
  });
});

describe('getRowValue', () => {
  it('returns null without a predicate, even with an object', () => {
    const current = row();
    expect(getRowValue({ ...current, object: { ...current.object, value: 'Pearson' } })).toBeNull();
  });

  it('returns null for a row without object', () => {
    const current = row();
    expect(getRowValue({ ...current, predicate: { ...current.predicate, picked: knows } })).toBeNull();
  });

  it('types free text as literal or uri', () => {
    const current = row();
    const withPredicate = { ...current, predicate: { ...current.predicate, picked: knows } };
    expect(getRowValue({ ...withPredicate, object: { ...current.object, value: 'Pearson' } })).toEqual({
      predicate: knows,
      objectType: 'literal',
      object: { label: 'Pearson', uri: null },
    });
    expect(getRowValue({ ...withPredicate, object: { ...current.object, value: 'https://x.org' } })?.objectType)
      .toBe('uri');
  });

  it('returns a picked object as a search URI', () => {
    const current = row();
    const value = getRowValue({
      ...current,
      predicate: { ...current.predicate, picked: knows },
      object: {
        ...current.object,
        value: 'Person',
        picked: { uri: 'http://foaf/Person', label: 'Person', elementType: 'class' },
      },
    });
    expect(value).toEqual({
      predicate: knows,
      objectType: 'uri',
      object: {
        uri: 'http://foaf/Person', label: 'Person', elementType: 'class', source: 'search'
      },
    });
  });

  it('keeps the stored triple of an unedited row', () => {
    const raw = { predicate: { label: 'x', uri: 'y' }, objectType: 'date', object: { date: '2020' } };
    expect(getRowValue(row({ _raw: raw }))?._raw).toBe(raw);
  });
});

describe('getObjectIndicator', () => {
  it('shows the element type, the legacy rdf type, or the free-text type', () => {
    const current = row();
    expect(getObjectIndicator({
      ...current, object: { ...current.object, picked: { uri: 'u', label: 'l', elementType: 'entity' } }
    })).toBe('entity');
    expect(getObjectIndicator({
      ...current, object: { ...current.object, picked: { uri: 'u', label: 'l' }, altValue: 'Company' }
    })).toBe('Company');
    expect(getObjectIndicator({
      ...current, object: { ...current.object, picked: { uri: 'u', label: 'l' } }
    })).toBe('uri');
    expect(getObjectIndicator({ ...current, object: { ...current.object, type: 'uri' } })).toBe('uri');
  });
});
