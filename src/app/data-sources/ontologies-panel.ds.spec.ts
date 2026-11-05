import { translate } from '@net7/core';
import { OntologiesPanelDS } from './ontologies-panel.ds';

describe('OntologiesPanelDS', () => {
  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'ontologiespanel#title', 'ontologiespanel#description', 'ontologiespanel#saving',
      'ontologiespanel#list_title', 'ontologiespanel#own_empty',
      'ontologiespanel#shared_badge', 'ontologiespanel#shared_title',
      'ontologiespanel#import_title', 'ontologiespanel#import', 'ontologiespanel#import_description',
      'ontologiespanel#error',
      'semantic#type_entity', 'semantic#type_class', 'semantic#type_predicate',
      'ontologiespanel#use_entity', 'ontologiespanel#use_class', 'ontologiespanel#use_predicate',
      'ontologiespanel#no_entity', 'ontologiespanel#no_class', 'ontologiespanel#no_predicate',
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  const run = (input: any) => {
    const dataSource = new OntologiesPanelDS();
    dataSource.update(input);
    return dataSource.output;
  };

  it('derives the badges from the counts, in the design order', () => {
    const output = run({
      status: 'loaded',
      ontologies: [{
        id: '1', name: 'FOAF', prefix: 'foaf', selected: true, selectedCategories: ['predicate'],
        counts: { predicate: 40, class: 12, entity: 0 },
      }],
    });
    expect(output.items[0].types.map(({
      type, active, count, disabled
    }: any) => [type, active, count, disabled])).toEqual([
      ['entity', false, 0, true], ['class', false, 12, false], ['predicate', true, 40, false],
    ]);
    expect(output.items[0].selected).toBe(true);
    expect(output.items[0].isSaving).toBe(false);
  });

  it('marks the ontologies being saved', () => {
    const output = run({
      status: 'loaded',
      savingIds: ['1'],
      ontologies: [{
        id: '1', name: 'FOAF', selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 },
      }],
    });
    expect(output.items[0].isSaving).toBe(true);
  });

  it('shows the prefix under the name only when it differs from the name', () => {
    const output = run({
      status: 'loaded',
      ontologies: [
        { id: '1', name: 'Friend of a Friend', prefix: 'foaf', selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 } },
        { id: '2', name: 'gc', prefix: 'gc', selected: false, selectedCategories: [], counts: { predicate: 0, class: 1, entity: 0 } },
        { id: '3', name: 'My predicates', selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 } },
      ],
    });
    expect(output.items.map(({ sourceLabel }: any) => sourceLabel)).toEqual(['foaf', undefined, undefined]);
  });

  it('lists the user ontologies first and the built-in ones last, marked as shared', () => {
    const output = run({
      status: 'loaded',
      ontologies: [
        { id: 'p', name: 'Pundit predicates', shared: true, selected: true, selectedCategories: ['predicate'], counts: { predicate: 9, class: 0, entity: 0 } },
        { id: '1', name: 'FOAF', shared: false, selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 } },
        { id: '2', name: 'Mine', selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 } },
      ],
    });
    expect(output.items.map(({ id, shared }: any) => [id, shared])).toEqual([['1', false], ['2', false], ['p', true]]);
    expect(output.hasOwn).toBe(true);
    expect(output.labels.sharedBadge).toBe('ontologiespanel#shared_badge');
  });

  it('knows when the user imported no ontology', () => {
    const output = run({
      status: 'loaded',
      ontologies: [
        { id: 'p', name: 'Pundit predicates', shared: true, selected: true, selectedCategories: ['predicate'], counts: { predicate: 9, class: 0, entity: 0 } },
        { id: '1', name: 'Empty', selected: false, selectedCategories: [], counts: { predicate: 0, class: 0, entity: 0 } },
      ],
    });
    expect(output.items.map(({ id }: any) => id)).toEqual(['p']);
    expect(output.hasOwn).toBe(false);
  });

  it('does not list an ontology without elements', () => {
    const output = run({
      status: 'loaded',
      ontologies: [
        { id: '1', name: 'Empty', selected: false, selectedCategories: [], counts: { predicate: 0, class: 0, entity: 0 } },
        { id: '2', name: 'Full', selected: false, selectedCategories: [], counts: { predicate: 1, class: 0, entity: 0 } },
      ],
    });
    expect(output.items.map(({ id }: any) => id)).toEqual(['2']);
  });

  it('passes the status and the dashboard link through', () => {
    const output = run({ status: 'error', ontologies: [], ontologiesLink: 'https://x/ontologies' });
    expect(output.status).toBe('error');
    expect(output.items).toEqual([]);
    expect(output.hasOwn).toBe(false);
    expect(output.ontologiesLink).toBe('https://x/ontologies');
  });
});
