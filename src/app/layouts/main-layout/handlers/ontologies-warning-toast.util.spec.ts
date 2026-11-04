import { BehaviorSubject, Subject } from 'rxjs';
import { translate } from '@net7/core';
import { _c } from 'src/app/models/config';
import { warnIfNoOntologyPredicates } from './ontologies-warning-toast.util';

jest.mock('src/app/models/config', () => ({ _c: jest.fn() }));

describe('warnIfNoOntologyPredicates', () => {
  let toastService: { warn: jest.Mock };
  let ontologyService: any;

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'toast#ontologies_missing_title', 'toast#ontologies_missing_text', 'toast#ontologies_missing_action',
      'toast#ontologies_no_predicates_title', 'toast#ontologies_no_predicates_text',
      'toast#ontologies_no_predicates_action',
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  beforeEach(() => {
    (_c as jest.Mock).mockReturnValue('https://app/ontologies');
    toastService = { warn: jest.fn() };
    ontologyService = {
      status$: new BehaviorSubject('loaded'),
      openPanel$: new Subject<void>(),
      hasSelection: jest.fn(() => false),
      hasUsableOntologies: jest.fn(() => false),
    };
  });

  const action = () => {
    const params = toastService.warn.mock.calls[0][0];
    const toast = { close: jest.fn() };
    params.onAction(params.actions[0].payload, toast);
    return toast;
  };

  it('invites to import ontologies when the user has none', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn.mock.calls[0][0].title).toBe('toast#ontologies_missing_title');
    const toast = action();
    expect(open).toHaveBeenCalledWith('https://app/ontologies', '_blank', 'noopener');
    expect(toast.close).toHaveBeenCalled();
    open.mockRestore();
  });

  it('opens the Ontologies panel when no ontology is used for predicates', () => {
    ontologyService.hasUsableOntologies.mockReturnValue(true);
    const opened = jest.fn();
    ontologyService.openPanel$.subscribe(opened);
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn.mock.calls[0][0].title).toBe('toast#ontologies_no_predicates_title');
    action();
    expect(opened).toHaveBeenCalled();
  });

  it('says nothing when some ontology is used for predicates', () => {
    ontologyService.hasSelection.mockReturnValue(true);
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn).not.toHaveBeenCalled();
  });

  it('says nothing while the list is not loaded', () => {
    ontologyService.status$.next('error');
    warnIfNoOntologyPredicates(ontologyService, toastService as any);
    expect(toastService.warn).not.toHaveBeenCalled();
  });
});
