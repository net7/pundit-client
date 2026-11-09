import { BehaviorSubject, Subject } from 'rxjs';
import { translate } from '@net7/core';
import { OntologyService } from 'src/app/services/ontology.service';
import { warnIfNoOntologyPredicates } from './ontologies-warning-toast.util';

describe('warnIfNoOntologyPredicates', () => {
  let toastService: { warn: jest.Mock };
  let ontologyService: any;

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'toast#ontologies_no_predicates_title', 'toast#ontologies_no_predicates_text',
      'toast#ontologies_no_predicates_action',
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  beforeEach(() => {
    toastService = { warn: jest.fn() };
    ontologyService = {
      status$: new BehaviorSubject('loaded'),
      openPanel$: new Subject<void>(),
      hasSelection: jest.fn(() => false),
    };
  });

  const params = () => toastService.warn.mock.calls[0][0];

  const action = (index: number) => {
    const toast = { close: jest.fn() };
    params().onAction(params().actions[index].payload, toast);
    return toast;
  };

  it('warns with a single button that opens the Ontologies panel', () => {
    const opened = jest.fn();
    ontologyService.openPanel$.subscribe(opened);
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn).toHaveBeenCalledTimes(1);
    expect(params().title).toBe('toast#ontologies_no_predicates_title');
    expect(params().actions.map(({ text }: any) => text)).toEqual(['toast#ontologies_no_predicates_action']);
    const toast = action(0);
    expect(opened).toHaveBeenCalled();
    expect(toast.close).toHaveBeenCalled();
  });

  it('says nothing when some ontology is used for predicates', () => {
    ontologyService.hasSelection.mockReturnValue(true);
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn).not.toHaveBeenCalled();
  });

  it('says nothing when only the shared ontology is selected, as by default', () => {
    const service = new OntologyService();
    service.ontologies$.next([{
      id: 'pundit', name: 'Pundit predicates', shared: true,
      counts: { predicate: 9, class: 0, entity: 0 },
      selected: true, selectedCategories: ['predicate'],
    }]);
    service.status$.next('loaded');
    warnIfNoOntologyPredicates(service, toastService as any);
    expect(toastService.warn).not.toHaveBeenCalled();
  });

  it('says nothing while the list is not loaded', () => {
    ontologyService.status$.next('error');
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn).not.toHaveBeenCalled();
  });
});
