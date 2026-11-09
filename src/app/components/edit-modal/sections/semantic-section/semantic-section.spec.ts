import { ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { Subject, of, timer } from 'rxjs';
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
  let ontologyService: { hasSelection: jest.Mock; search: jest.Mock };
  let changed$: Subject<any>;

  const create = (initialValue?: any) => {
    ontologyService = { hasSelection: jest.fn(() => true), search: jest.fn() };
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
});
