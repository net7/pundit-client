import { TestBed } from '@angular/core/testing';
import { OntologiesPanelComponent, OntologiesPanelData, OntologiesPanelItem } from './ontologies-panel';

const item = (id: string, name: string, shared: boolean): OntologiesPanelItem => ({
  id,
  name,
  shared,
  types: [],
  selected: false,
  isSaving: false,
});

const data = (items: OntologiesPanelItem[]): OntologiesPanelData => ({
  status: 'loaded',
  items,
  labels: {
    title: 'Ontologies',
    description: '',
    empty: '',
    emptyLink: '',
    error: '',
    saving: '',
    shared: 'Pundit',
    sharedTitle: 'Shared ontology provided by Pundit',
    typeNames: { entity: 'Entity', class: 'Class', predicate: 'Predicate' },
  },
});

describe('OntologiesPanelComponent', () => {
  it('shows the Pundit badge only next to shared ontologies', () => {
    const fixture = TestBed.createComponent(OntologiesPanelComponent);
    fixture.componentRef.setInput('data', data([
      item('pundit', 'Pundit predicates', true),
      item('1', 'FOAF', false),
    ]));
    fixture.detectChanges();

    const names: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.pnd-ontologies-panel__name')
    );
    const badges = names.map((name) => name.querySelector('.pnd-ontologies-panel__shared'));
    expect(badges[0]?.textContent?.trim()).toBe('Pundit');
    expect(badges[0]?.getAttribute('title')).toBe('Shared ontology provided by Pundit');
    expect(badges[1]).toBeNull();
  });
});
