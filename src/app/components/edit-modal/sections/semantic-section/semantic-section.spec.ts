import { ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import {
  BehaviorSubject, Subject, of, throwError, timer
} from 'rxjs';
import { map } from 'rxjs/operators';
import { translate } from '@net7/core';
import en from 'src/app/config/i18n/en_US';
import { OntologyService } from 'src/app/services/ontology.service';
import { SemanticSectionComponent } from './semantic-section';

// the real models load the analytics and cross-message layers, which keep timers alive
jest.mock('src/common/models', () => ({ OntologyModel: {} }));

const element = (label: string) => ({
  uri: `http://onto/${label}`, label, category: 'class' as const, ontology: { name: 'Onto', prefix: 'onto' }
});

describe('SemanticSectionComponent > object autocomplete', () => {
  let component: SemanticSectionComponent;
  let ontologyService: {
    hasSelection: jest.Mock; search: jest.Mock; getElementCount: jest.Mock; ontologies$: BehaviorSubject<any[]>;
  };
  let changed$: Subject<any>;

  const create = (initialValue?: any) => {
    ontologyService = {
      hasSelection: jest.fn(() => true),
      search: jest.fn(),
      getElementCount: jest.fn(() => 0),
      ontologies$: new BehaviorSubject<any[]>([{ id: '1', selectedCategories: ['predicate'] }]),
    };
    const injector = Injector.create({
      providers: [
        { provide: OntologyService, useValue: ontologyService },
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
      ]
    });
    changed$ = new Subject();
    component = runInInjectionContext(injector, () => new SemanticSectionComponent());
    component.data = { changed$, initialValue } as any;
    component.reset$ = new Subject();
    component.ngAfterViewInit();
  };

  beforeAll(() => {
    translate.init({ defaultLang: 'en', translations: { en } });
  });

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    component.ngOnDestroy();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows only the answer to the latest text', () => {
    create();
    // the first query answers after the second one
    ontologyService.search.mockImplementation((query: string) => timer(query === 'pers' ? 1000 : 10).pipe(
      map(() => [element(query === 'pers' ? 'Person' : 'Persona')])
    ));
    component.onObjectChange(0, 'pers');
    jest.advanceTimersByTime(300);
    component.onObjectChange(0, 'perso');
    jest.advanceTimersByTime(300 + 10);
    jest.advanceTimersByTime(1000);

    expect(component.rows[0].object.options.map(({ label }) => label)).toEqual(['Persona']);
    expect(ontologyService.search).toHaveBeenLastCalledWith('perso', ['class', 'entity']);
  });

  it('does not search without a selected ontology or with an empty field', () => {
    create();
    ontologyService.hasSelection.mockReturnValue(false);
    component.onObjectChange(0, 'person');
    ontologyService.hasSelection.mockReturnValue(true);
    component.onObjectChange(0, '');
    jest.advanceTimersByTime(1000);

    expect(ontologyService.search).not.toHaveBeenCalled();
    expect(component.rows[0].object.isExpanded).toBe(false);
  });

  it('emits a picked object and turns it back to free text when edited', () => {
    create();
    const values: any[] = [];
    changed$.subscribe(({ value }) => values.push(value));
    ontologyService.search.mockReturnValue(of([element('Person')]));
    component.onPredicateChange(0, { label: 'knows', value: 'http://foaf/knows' });

    component.onObjectChange(0, 'pers');
    jest.advanceTimersByTime(300);
    component.onObjectPick(0, component.rows[0].object.options[0]);
    expect(values[values.length - 1][0].object).toEqual({
      uri: 'http://onto/Person', label: 'Person', elementType: 'class', source: 'search'
    });

    component.onObjectChange(0, 'Person!');
    expect(component.rows[0].object.picked).toBeNull();
    expect(values[values.length - 1][0]).toEqual(expect.objectContaining({ objectType: 'literal' }));
  });

  it('reopens a saved ontology predicate and object, keeping the triple until edited', () => {
    const triple = {
      predicate: { label: 'knows', uri: 'http://foaf/knows' },
      objectType: 'uri',
      object: {
        uri: 'http://foaf/Person', label: 'Person', source: 'search', elementType: 'class'
      },
    };
    create([{
      predicate: triple.predicate,
      object: {
        uri: 'http://foaf/Person', label: 'Person', source: 'search', elementType: 'class'
      },
      objectType: 'uri',
      _raw: triple,
    }]);
    const [row] = component.rows;
    expect(row.disabled).toBe(false);
    expect(row.predicate.picked).toEqual({ label: 'knows', uri: 'http://foaf/knows' });
    expect(row.object.picked?.elementType).toBe('class');

    const values: any[] = [];
    changed$.subscribe(({ value }) => values.push(value));
    component.onPredicateChange(0, { label: 'is related to', value: 'http://skos/related', sourceLabel: 'skos' });
    expect(values[0][0]).toEqual({
      predicate: { label: 'is related to', uri: 'http://skos/related', sourceLabel: 'skos' },
      objectType: 'uri',
      object: {
        uri: 'http://foaf/Person', label: 'Person', elementType: 'class', source: 'search'
      },
    });
  });

  it('searches ontology predicates while typing in the predicate field and picks one', () => {
    create();
    const values: any[] = [];
    changed$.subscribe(({ value }) => values.push(value));
    ontologyService.search.mockReturnValue(of([{
      uri: 'http://foaf/knows', label: 'knows', category: 'predicate', ontology: { name: 'FOAF', prefix: 'foaf' }
    }]));

    component.onPredicateFocus(0);
    expect(component.rows[0].predicate.isExpanded).toBe(true);
    component.onPredicateQueryChange(0, 'kno');
    expect(component.rows[0].predicate.isLoading).toBe(true);
    jest.advanceTimersByTime(300);

    expect(ontologyService.search).toHaveBeenCalledWith('kno', ['predicate']);
    const options = component.getPredicateOptions(component.rows[0]);
    expect(options.map(({ label }) => label)).toEqual(['knows']);
    expect(component.rows[0].predicate.isLoading).toBe(false);

    component.onObjectChange(0, 'Pearson');
    component.onPredicateChange(0, options[0]);
    expect(component.rows[0].predicate.label).toBe('knows');
    expect(component.rows[0].predicate.isExpanded).toBe(false);
    expect(values[values.length - 1][0].predicate).toEqual({ label: 'knows', uri: 'http://foaf/knows', sourceLabel: 'foaf' });
  });

  it('keeps the selected predicate when the field is left without a choice', () => {
    create();
    ontologyService.search.mockReturnValue(of([]));
    component.onPredicateFocus(0);
    component.onPredicateQueryChange(0, 'zz');
    component.onPredicateBlur(0);
    jest.advanceTimersByTime(300);
    expect(component.rows[0].predicate.isExpanded).toBe(false);
    expect(component.rows[0].predicate.query).toBe('');
    expect(component.rows[0].predicate.label).toBe('');
    expect(component.rows[0].predicate.picked).toBeNull();
  });

  it('starts a new row without a predicate and emits nothing until one is picked', () => {
    create();
    const values: any[] = [];
    changed$.subscribe(({ value }) => values.push(value));
    expect(component.rows[0].predicate.picked).toBeNull();
    component.onObjectChange(0, 'Pearson');
    expect(values[values.length - 1]).toEqual([]);
  });

  it('reopens a triple with a former basic predicate as selected', () => {
    const triple = {
      predicate: { label: 'is related to', uri: 'http://www.w3.org/2004/02/skos/core#related' },
      objectType: 'literal',
      object: { text: 'Pearson' },
    };
    create([{
      predicate: triple.predicate, object: { label: 'Pearson', uri: null }, objectType: 'literal', _raw: triple,
    }]);
    expect(component.rows[0].predicate.picked).toEqual(triple.predicate);
    expect(component.rows[0].predicate.label).toBe('is related to');
  });
  describe('first predicates', () => {
    const predicate = (label: string) => ({
      uri: `http://onto/${label}`, label, category: 'predicate' as const, ontology: { name: 'Onto', prefix: 'onto' }
    });
    const firstTen = Array.from({ length: 10 }, (_, i) => predicate(`p${i}`));
    const labels = (rowIndex = 0) => component.getPredicateOptions(component.rows[rowIndex]).map(({ label }) => label);

    it('lists the first predicates when an empty field is focused', () => {
      create();
      ontologyService.search.mockReturnValue(timer(50).pipe(map(() => firstTen)));
      component.onPredicateFocus(0);

      expect(ontologyService.search).toHaveBeenCalledWith('', ['predicate'], 10);
      expect(component.isDefaultPredicatesLoading(component.rows[0])).toBe(true);
      jest.advanceTimersByTime(50);
      expect(component.isDefaultPredicatesLoading(component.rows[0])).toBe(false);
      expect(labels()).toEqual(firstTen.map(({ label }) => label));
    });

    it('picks a first predicate like a searched one', () => {
      create();
      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      ontologyService.search.mockReturnValue(of(firstTen));
      component.onPredicateFocus(0);
      component.onObjectChange(0, 'Pearson');
      component.onPredicateChange(0, component.getPredicateOptions(component.rows[0])[2]);
      expect(values[values.length - 1][0].predicate).toEqual({ label: 'p2', uri: 'http://onto/p2', sourceLabel: 'onto' });
      // reopened, the picked predicate is marked
      component.onPredicateFocus(0);
      expect(component.getPredicateOptions(component.rows[0]).find(({ selected }) => selected)?.label).toBe('p2');
    });

    it('shows the total footer only when more predicates exist', () => {
      create();
      ontologyService.search.mockReturnValue(of(firstTen));
      ontologyService.getElementCount.mockReturnValue(248);
      component.onPredicateFocus(0);
      expect(component.getPredicateTotalLabel(component.rows[0])).toBe('Type to search among 248 predicates');

      component.onPredicateQueryChange(0, 'p');
      expect(component.getPredicateTotalLabel(component.rows[0])).toBeNull();

      ontologyService.getElementCount.mockReturnValue(10);
      ontologyService.ontologies$.next([{ id: '2', selectedCategories: ['predicate'] }]);
      component.onPredicateFocus(0);
      expect(component.getPredicateTotalLabel(component.rows[0])).toBeNull();
    });

    it('reuses the first predicates across rows and openings', () => {
      create();
      ontologyService.search.mockReturnValue(of(firstTen));
      component.onPredicateFocus(0);
      component.onPredicateBlur(0);
      jest.advanceTimersByTime(300);
      component.onAddClick(0);
      component.onPredicateToggleExpand(1);
      component.onPredicateFocus(0);

      expect(ontologyService.search).toHaveBeenCalledTimes(1);
      expect(labels(1)).toHaveLength(10);
    });

    it('requests them again after the predicate selection changes', () => {
      create();
      ontologyService.search.mockReturnValue(of(firstTen));
      component.onPredicateFocus(0);
      // a change for other categories keeps them
      ontologyService.ontologies$.next([
        { id: '1', selectedCategories: ['predicate'] }, { id: '3', selectedCategories: ['class'] }
      ]);
      expect(ontologyService.search).toHaveBeenCalledTimes(1);

      ontologyService.search.mockReturnValue(of([predicate('other')]));
      ontologyService.ontologies$.next([{ id: '3', selectedCategories: ['class', 'predicate'] }]);
      // the open field reloads at once
      expect(ontologyService.search).toHaveBeenCalledTimes(2);
      expect(labels()).toEqual(['other']);
    });

    it('goes back to the first predicates when the typed text is cleared', () => {
      create();
      ontologyService.search.mockImplementation((query: string) => of(query ? [predicate('typed')] : firstTen));
      component.onPredicateFocus(0);
      component.onPredicateQueryChange(0, 'ty');
      jest.advanceTimersByTime(300);
      expect(labels()).toEqual(['typed']);

      component.onPredicateQueryChange(0, '');
      jest.advanceTimersByTime(300);
      expect(labels()).toHaveLength(10);
      expect(component.rows[0].predicate.searched).toBe(false);
    });

    it('falls back to the hint when the request fails, without asking again', () => {
      create();
      ontologyService.search.mockReturnValue(throwError(() => new Error('400')));
      component.onPredicateFocus(0);
      component.onPredicateBlur(0);
      jest.advanceTimersByTime(300);
      component.onPredicateFocus(0);

      expect(ontologyService.search).toHaveBeenCalledTimes(1);
      expect(labels()).toEqual([]);
      expect(component.getPredicateTotalLabel(component.rows[0])).toBeNull();
      expect(component.isDefaultPredicatesLoading(component.rows[0])).toBe(false);
    });

    it('falls back to the hint when the server returns nothing', () => {
      create();
      ontologyService.search.mockReturnValue(of([]));
      ontologyService.getElementCount.mockReturnValue(248);
      component.onPredicateFocus(0);
      expect(labels()).toEqual([]);
      expect(component.getPredicateTotalLabel(component.rows[0])).toBeNull();
    });

    it('does not ask for them when no ontology is used for predicates', () => {
      create();
      ontologyService.hasSelection.mockReturnValue(false);
      component.onPredicateFocus(0);
      expect(ontologyService.search).not.toHaveBeenCalled();
      expect(labels()).toEqual([]);
    });

    it('requests them again after a reset', () => {
      create();
      ontologyService.search.mockReturnValue(throwError(() => new Error('400')));
      component.onPredicateFocus(0);
      component.reset$.next();
      ontologyService.search.mockReturnValue(of(firstTen));
      component.onPredicateFocus(0);
      expect(ontologyService.search).toHaveBeenCalledTimes(2);
      expect(labels()).toHaveLength(10);
    });
  });

  describe('blocks of relations about an ontology element', () => {
    const knows = { label: 'knows', uri: 'http://foaf/knows' };
    const dante = { uri: 'http://onto/Dante', label: 'Dante Alighieri', elementType: 'entity', source: 'search' };
    const beatrice = { uri: 'http://onto/Beatrice', label: 'Beatrice', elementType: 'entity', source: 'search' };
    const stored = (text: string, subject?: any) => ({
      ...(subject ? { subject } : {}), predicate: knows, objectType: 'literal', object: { text }
    });
    const reopen = (triple: any) => ({
      predicate: knows, object: { label: triple.object.text, uri: null }, objectType: 'literal',
      subject: triple.subject, _raw: triple,
    });
    const lastValue = (values: any[]) => values[values.length - 1];
    const subjectIndex = (n: number) => component.groups.indexOf(component.subjectGroups[n]);

    it('starts a new annotation with the rows about the selection only, as before', () => {
      create();
      expect(component.fragmentGroup?.subject.isFragment).toBe(true);
      expect(component.subjectGroups).toEqual([]);
      expect(component.rows.map(({ groupId }) => groupId)).toEqual([component.fragmentGroup?.id]);
    });

    it('emits only the complete block', () => {
      create();
      component.onAddGroupClick();
      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      const describingRow = component.rows.length - 1;
      // describing row filled, but no subject picked: nothing to save
      component.onPredicateChange(describingRow, { label: 'knows', value: knows.uri });
      component.onObjectChange(describingRow, 'Durante');
      expect(lastValue(values)).toEqual([]);
      // linking row complete: only it is saved
      component.onPredicateChange(0, { label: 'knows', value: knows.uri });
      component.onObjectChange(0, 'Dante');
      expect(lastValue(values).map(({ object, subject }: any) => [object.label, subject])).toEqual([['Dante', undefined]]);
    });

    it('reopens the selection relations first, then the other subjects in stored order', () => {
      const triples = [stored('a', dante), stored('b', dante), stored('c'), stored('d', beatrice), stored('e', dante)];
      create(triples.map(reopen));
      expect(component.getGroupRows(component.fragmentGroup!).map(({ row }) => row.object.value)).toEqual(['c']);
      expect(component.subjectGroups.map(({ subject }) => subject.picked?.uri))
        .toEqual([dante.uri, beatrice.uri, dante.uri]);

      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      component.onSubjectPick(subjectIndex(1), element('Other'));
      expect(lastValue(values).map(({ _raw }: any) => _raw.object.text)).toEqual(['c', 'a', 'b', 'd', 'e']);
    });

    it('keeps an empty row about the selection when every triple has an element subject', () => {
      create([stored('a', dante)].map(reopen));
      expect(component.getGroupRows(component.fragmentGroup!)).toHaveLength(1);
      expect(component.getGroupRows(component.fragmentGroup!)[0].row.object.value).toBeNull();
    });

    it('applies a picked subject to all the triples of the group', () => {
      create([stored('a', dante), stored('b', dante)].map(reopen));
      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      ontologyService.search.mockReturnValue(of([{ ...element('Beatrice'), category: 'entity' }]));

      component.onSubjectQueryChange(subjectIndex(0), 'bea');
      jest.advanceTimersByTime(300);
      expect(ontologyService.search).toHaveBeenLastCalledWith('bea', ['class', 'entity']);
      component.onSubjectPick(subjectIndex(0), component.subjectGroups[0].subject.options[0]);

      expect(lastValue(values).map(({ subject, subjectChanged }: any) => [subject?.uri, subjectChanged]))
        .toEqual([['http://onto/Beatrice', true], ['http://onto/Beatrice', true]]);
    });

    it('takes a typed URI as subject, never other free text', () => {
      create([stored('a', beatrice)].map(reopen));
      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      const index = subjectIndex(0);

      component.onSubjectQueryChange(index, 'Dante');
      component.onSubjectPickUri(index);
      expect(component.groups[index].subject.picked?.uri).toBe(beatrice.uri);

      component.onSubjectQueryChange(index, ' https://example.org/vita-nova ');
      component.onSubjectKeydown(index, { key: 'Enter', preventDefault: jest.fn() } as any);
      expect(component.groups[index].subject.picked)
        .toEqual({ uri: 'https://example.org/vita-nova', label: 'https://example.org/vita-nova', source: 'free-text' });
      expect(lastValue(values)[0].subject)
        .toEqual(expect.objectContaining({ uri: 'https://example.org/vita-nova', source: 'free-text' }));
    });

    it('keeps a typed URI when the field is left', () => {
      create([stored('a', beatrice)].map(reopen));
      const index = subjectIndex(0);
      component.onSubjectFocus(index);
      component.onSubjectQueryChange(index, 'urn:isbn:9788817');
      component.onSubjectBlur(index);
      jest.advanceTimersByTime(300);
      expect(component.groups[index].subject.picked?.source).toBe('free-text');
      expect(component.groups[index].subject.picked?.uri).toBe('urn:isbn:9788817');
    });

    it('keeps the subject when the field is left without a choice', () => {
      create([stored('a', beatrice)].map(reopen));
      const index = subjectIndex(0);
      component.onSubjectFocus(index);
      component.onSubjectQueryChange(index, 'free text');
      component.onSubjectBlur(index);
      jest.advanceTimersByTime(300);
      expect(component.groups[index].subject.picked?.uri).toBe(beatrice.uri);
      expect(component.groups[index].subject.query).toBe('');
    });

    it('adds a block without subject whose rows are not saved until one is picked', () => {
      create();
      const values: any[] = [];
      changed$.subscribe(({ value }) => values.push(value));
      component.onAddGroupClick();
      expect(component.subjectGroups).toHaveLength(1);
      const rowIndex = component.rows.length - 1;
      component.onPredicateChange(rowIndex, { label: 'knows', value: knows.uri });
      component.onObjectChange(rowIndex, 'Durante');
      expect(lastValue(values)).toEqual([]);

      component.onSubjectPick(subjectIndex(0), { ...element('Dante'), category: 'entity' });
      expect(lastValue(values)).toEqual([expect.objectContaining({
        subject: expect.objectContaining({ uri: 'http://onto/Dante', elementType: 'entity' }),
      })]);
    });

    it('removes an subject block with its last row, and clears the last row about the selection', () => {
      create([stored('a'), stored('b', dante), stored('c', beatrice)].map(reopen));
      component.onRemoveClick(2);
      expect(component.subjectGroups.map(({ subject }) => subject.picked?.uri)).toEqual([dante.uri]);
      component.onRemoveClick(1);
      expect(component.subjectGroups).toEqual([]);
      component.onRemoveClick(0);
      expect(component.rows).toHaveLength(1);
      expect(component.rows[0].object.value).toBeNull();
    });
  });
});
