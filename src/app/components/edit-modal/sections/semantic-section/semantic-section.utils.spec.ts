import {
  SemanticFormRow, SemanticSubjectGroup, getGroupsValue, getObjectIndicator, getPredicateOptions, getRowValue,
  toSubjectRuns,
} from './semantic-section.utils';

const row = (overrides: Partial<SemanticFormRow> = {}): SemanticFormRow => ({
  id: 1,
  groupId: 1,
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

  it('is empty without a search nor first predicates', () => {
    expect(getPredicateOptions(row())).toEqual([]);
  });

  it('lists the first predicates when nothing is typed, the selected one marked', () => {
    const current = row();
    const defaults = [
      { label: 'abstract', value: 'http://dc/abstract', sourceLabel: 'dc' },
      { label: 'knows', value: 'http://foaf/knows', sourceLabel: 'foaf' },
    ];
    const options = getPredicateOptions({
      ...current,
      predicate: { ...current.predicate, query: '  ', picked: knows, remote: [defaults[0]] },
    }, defaults);
    expect(options.map(({ label, selected }) => [label, selected])).toEqual([['abstract', false], ['knows', true]]);
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

describe('subject groups', () => {
  const dante = { uri: 'http://onto/Dante', label: 'Dante Alighieri', elementType: 'entity' as const };
  const beatrice = { uri: 'http://onto/Beatrice', label: 'Beatrice', elementType: 'entity' as const };

  const group = (id: number, subject: typeof dante | null, storedKey?: string): SemanticSubjectGroup => ({
    id,
    subject: {
      isFragment: !subject,
      picked: subject,
      query: '',
      options: [],
      searched: false,
      isExpanded: false,
      isLoading: false,
    },
    ...(storedKey ? { storedKey } : {}),
  });

  const filled = (id: number, groupId: number, text: string, _raw?: any): SemanticFormRow => {
    const current = row();
    return {
      ...current,
      id,
      groupId,
      predicate: { ...current.predicate, label: 'knows', picked: knows },
      object: { ...current.object, value: text, type: 'literal' },
      ...(_raw ? { _raw } : {}),
    };
  };

  it('splits interleaved subjects into runs, keeping their order', () => {
    const { runs, indexes } = toSubjectRuns([dante, dante, null, undefined, dante]);
    expect(runs).toEqual([dante, null, dante]);
    expect(indexes).toEqual([0, 0, 1, 1, 2]);
  });

  it('gives one fragment run when no triple has a subject', () => {
    expect(toSubjectRuns([undefined, null]).runs).toEqual([null]);
  });

  it('flattens the groups in display order, each row with its group subject', () => {
    const value = getGroupsValue(
      [filled(1, 1, 'a'), filled(2, 2, 'b'), filled(3, 3, 'c')],
      [group(1, null), group(2, dante), group(3, beatrice)],
    );
    expect(value.map(({ object, subject }) => [object.label, subject?.uri])).toEqual([
      ['a', undefined],
      ['b', dante.uri],
      ['c', beatrice.uri],
    ]);
    expect(value[1].subject).toEqual({ ...dante, source: 'search' });
  });

  it('drops the rows of a group without subject', () => {
    const noSubject = { ...group(2, null), subject: { ...group(2, null).subject, isFragment: false } };
    const value = getGroupsValue([filled(1, 1, 'a'), filled(2, 2, 'b')], [group(1, dante), noSubject]);
    expect(value.map(({ object }) => object.label)).toEqual(['a']);
  });

  it('marks an unedited row whose group subject changed', () => {
    const stored = { predicate: knows, objectType: 'literal', object: { text: 'a' } };
    const [unchanged] = getGroupsValue([filled(1, 1, 'a', stored)], [group(1, dante, dante.uri)]);
    const [changed] = getGroupsValue([filled(1, 1, 'a', stored)], [group(1, beatrice, dante.uri)]);
    expect(unchanged.subjectChanged).toBeUndefined();
    expect(changed.subjectChanged).toBe(true);
  });
});
