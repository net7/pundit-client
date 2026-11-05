import { TestBed } from '@angular/core/testing';
import { OntologiesPanelComponent, OntologiesPanelData, OntologiesPanelItem } from './ontologies-panel';

const item = (id: string, name: string, shared = false): OntologiesPanelItem => ({
  id,
  name,
  shared,
  types: [],
  selected: false,
  isSaving: false,
});

const data = (
  items: OntologiesPanelItem[],
  ontologiesLink = 'https://app/ontologies',
): OntologiesPanelData => ({
  status: 'loaded',
  items,
  hasOwn: items.some(({ shared }) => !shared),
  ontologiesLink,
  labels: {
    title: 'Ontologies',
    description: '',
    importSection: 'Import ontologies',
    importButton: 'Import an ontology',
    importDescription: 'Import your ontologies.',
    listSection: 'Available ontologies',
    ownEmpty: "You haven't imported any ontology yet.",
    sharedBadge: 'Built-in',
    sharedTitle: 'Provided by Pundit to every user',
    error: '',
    saving: '',
    typeNames: { entity: 'Entity', class: 'Class', predicate: 'Predicate' },
  },
});

describe('OntologiesPanelComponent', () => {
  const render = (input: OntologiesPanelData): HTMLElement => {
    const fixture = TestBed.createComponent(OntologiesPanelComponent);
    fixture.componentRef.setInput('data', input);
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  const section = (el: HTMLElement, kind: 'import' | 'list') => (
    el.querySelector<HTMLElement>(`.pnd-ontologies-panel__section--${kind}`)
  );

  const sectionKinds = (el: HTMLElement) => Array.from(el.querySelectorAll('section'))
    .map((node) => node.className.match(/--(\w+)/)?.[1]);

  const text = (container: HTMLElement | null, selector: string) => (
    container?.querySelector(selector)?.textContent?.trim()
  );

  it('shows the import section, with button and description, before the list', () => {
    const el = render(data([item('1', 'FOAF')]));
    expect(sectionKinds(el)).toEqual(['import', 'list']);
    const importSection = section(el, 'import');
    expect(text(importSection, '.pnd-ontologies-panel__label')).toBe('Import ontologies');
    expect(text(importSection, '.pnd-ontologies-panel__import-button')).toBe('Import an ontology');
    expect(importSection?.querySelector('a')?.getAttribute('href')).toBe('https://app/ontologies');
    expect(text(importSection, '.pnd-text-small')).toBe('Import your ontologies.');
  });

  it('marks the built-in ontologies in the list', () => {
    const el = render(data([item('1', 'FOAF'), item('pundit', 'Pundit predicates', true)]));
    const names = Array.from(el.querySelectorAll<HTMLElement>('.pnd-ontologies-panel__name'));
    const badges = names.map((name) => name.querySelector('.pnd-ontologies-panel__builtin'));
    expect(badges[0]).toBeNull();
    expect(badges[1]?.textContent?.trim()).toBe('Built-in');
    expect(badges[1]?.getAttribute('title')).toBe('Provided by Pundit to every user');
    expect(section(el, 'list')?.querySelector('.pnd-ontologies-panel__own-empty')).toBeNull();
  });

  it('says the user imported no ontology, above the built-in ones', () => {
    const el = render(data([item('pundit', 'Pundit predicates', true)]));
    const list = section(el, 'list');
    expect(text(list, '.pnd-ontologies-panel__own-empty')).toBe("You haven't imported any ontology yet.");
    expect(list?.querySelectorAll('.pnd-ontologies-panel__name')).toHaveLength(1);
  });

  it('has no import section without the import page link', () => {
    const el = render(data([], ''));
    expect(sectionKinds(el)).toEqual(['list']);
    expect(el.querySelector('a')).toBeNull();
  });
});
