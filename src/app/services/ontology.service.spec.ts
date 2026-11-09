import { firstValueFrom } from 'rxjs';
import { OntologyModel } from 'src/common/models';
import { OntologySummary } from 'src/communication';
import {
  getOntologySourceLabel, OntologyService, SELECTION_SAVE_DELAY
} from './ontology.service';

jest.mock('src/common/models', () => ({
  OntologyModel: {
    list: jest.fn(),
    saveSelection: jest.fn(),
    searchElements: jest.fn(),
  }
}));

const listMock = OntologyModel.list as jest.Mock;
const saveMock = OntologyModel.saveSelection as jest.Mock;
const searchMock = OntologyModel.searchElements as jest.Mock;

const ontology = (id: string, selected: boolean): OntologySummary => ({
  id,
  name: `Ontology ${id}`,
  counts: { predicate: 1, class: 1, entity: 0 },
  selected,
  selectedCategories: selected ? ['class', 'predicate'] : [],
});

const ALL = ['class', 'predicate'];

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('OntologyService', () => {
  let service: OntologyService;

  beforeEach(async () => {
    jest.useFakeTimers();
    listMock.mockReset();
    saveMock.mockReset();
    searchMock.mockReset();
    service = new OntologyService();
    listMock.mockResolvedValue({ data: { data: [ontology('1', true), ontology('2', false)] } });
    await firstValueFrom(service.load());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const selectedIds = () => service.ontologies$.value.filter(({ selected }) => selected).map(({ id }) => id);

  it('loads the ontologies and marks the list as loaded', () => {
    expect(service.ontologies$.value).toHaveLength(2);
    expect(service.status$.value).toBe('loaded');
    expect(service.hasSelection()).toBe(true);
  });

  it('reports a load failure without throwing', async () => {
    listMock.mockRejectedValue(new Error('boom'));
    const result = await firstValueFrom(service.load());
    expect(result).toEqual([]);
    expect(service.status$.value).toBe('error');
    expect(service.hasSelection()).toBe(false);
  });

  it('toggles at once and saves rapid toggles with one request', async () => {
    saveMock.mockResolvedValue({ data: { data: { ontologies: [{ id: '2', categories: ALL }] } } });
    service.toggle('2');
    service.toggle('1');
    expect(selectedIds()).toEqual(['2']);
    expect(saveMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith({ ontologies: [{ id: '2', categories: ALL }] });
  });

  it('restores the saved selection and signals when saving fails', async () => {
    saveMock.mockRejectedValue(new Error('boom'));
    const errors = jest.fn();
    service.saveError$.subscribe(errors);
    service.toggle('2');
    expect(selectedIds()).toEqual(['1', '2']);

    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();

    expect(selectedIds()).toEqual(['1']);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('sends the shared ontology in the selection while it is checked', async () => {
    const shared: OntologySummary = {
      id: 'pundit', name: 'Pundit predicates', shared: true,
      counts: { predicate: 9, class: 0, entity: 0 },
      selected: true, selectedCategories: ['predicate'],
    };
    listMock.mockResolvedValue({ data: { data: [shared, ontology('2', false)] } });
    await firstValueFrom(service.load());
    // the server keeps what it receives
    saveMock.mockImplementation(async ({ ontologies }) => ({ data: { data: { ontologies } } }));

    service.toggle('2');
    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();
    expect(saveMock).toHaveBeenLastCalledWith({
      ontologies: [{ id: 'pundit', categories: ['predicate'] }, { id: '2', categories: ALL }],
    });

    service.toggle('pundit');
    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();
    expect(saveMock).toHaveBeenLastCalledWith({ ontologies: [{ id: '2', categories: ALL }] });
  });

  it('shows the ids kept by the server', async () => {
    saveMock.mockResolvedValue({ data: { data: { ontologies: [{ id: '1', categories: ALL }] } } });
    service.toggle('2');
    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();
    expect(selectedIds()).toEqual(['1']);
  });

  it('sends a pending save before searching', async () => {
    const calls: string[] = [];
    saveMock.mockImplementation(async () => {
      calls.push('save');
      return { data: { data: { ontologies: [{ id: '1', categories: ALL }, { id: '2', categories: ALL }] } } };
    });
    searchMock.mockImplementation(async () => { calls.push('search'); return { data: { data: [] } }; });
    service.toggle('2');

    await firstValueFrom(service.search('pers', ['class', 'entity']));

    expect(calls).toEqual(['save', 'search']);
    expect(searchMock).toHaveBeenCalledWith({ query: 'pers', categories: ['class', 'entity'] });
  });

  it('does not search without a selection', async () => {
    saveMock.mockResolvedValue({ data: { data: { ontologies: [] } } });
    service.toggle('1');
    const result = await firstValueFrom(service.search('pers', ['class']));
    expect(result).toEqual([]);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('returns the elements found', async () => {
    const element = {
      uri: 'http://x/Person', label: 'Person', category: 'class', ontology: { name: 'X' }
    };
    searchMock.mockResolvedValue({ data: { data: [element] } });
    const result = await firstValueFrom(service.search('pers', ['class']));
    expect(result).toEqual([element]);
  });

  it('selects an ontology with only the categories it has', () => {
    service.toggle('2');
    expect(service.ontologies$.value[1].selectedCategories).toEqual(ALL);
  });

  it('toggles single categories and deselects with the last one', () => {
    service.toggleCategory('1', 'class');
    expect(service.ontologies$.value[0].selectedCategories).toEqual(['predicate']);
    expect(service.ontologies$.value[0].selected).toBe(true);
    service.toggleCategory('1', 'predicate');
    expect(service.ontologies$.value[0].selected).toBe(false);
    service.toggleCategory('2', 'predicate');
    expect(service.ontologies$.value[1].selectedCategories).toEqual(['predicate']);
  });

  it('ignores categories without elements', () => {
    service.toggleCategory('2', 'entity');
    expect(service.ontologies$.value[1].selected).toBe(false);
  });

  it('skips a search for categories no ontology is used for', async () => {
    service.toggleCategory('1', 'class');
    saveMock.mockResolvedValue({ data: { data: { ontologies: [{ id: '1', categories: ['predicate'] }] } } });
    const result = await firstValueFrom(service.search('pers', ['class', 'entity']));
    expect(result).toEqual([]);
    expect(searchMock).not.toHaveBeenCalled();
    expect(service.hasSelection(['predicate'])).toBe(true);
  });

  it('marks an ontology as saving from the change until the save answers', async () => {
    let answer: ((value: unknown) => void) | undefined;
    saveMock.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
    service.toggleCategory('1', 'class');
    expect(service.savingIds$.value).toEqual(['1']);

    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();
    expect(service.savingIds$.value).toEqual(['1']);

    answer?.({ data: { data: { ontologies: [{ id: '1', categories: ['predicate'] }] } } });
    await flushPromises();
    expect(service.savingIds$.value).toEqual([]);
  });

  it('clears the saving state when the save fails', async () => {
    saveMock.mockRejectedValue(new Error('boom'));
    service.toggle('2');
    jest.advanceTimersByTime(SELECTION_SAVE_DELAY);
    await flushPromises();
    expect(service.savingIds$.value).toEqual([]);
  });

  it('clears everything', () => {
    service.clear();
    expect(service.ontologies$.value).toEqual([]);
    expect(service.status$.value).toBe('idle');
  });
});

describe('getOntologySourceLabel', () => {
  it('prefers the prefix and falls back to the name', () => {
    expect(getOntologySourceLabel({ name: 'Friend of a Friend', prefix: 'foaf' })).toBe('foaf');
    expect(getOntologySourceLabel({ name: 'My predicates' })).toBe('My predicates');
    expect(getOntologySourceLabel(null)).toBe('');
  });
});
