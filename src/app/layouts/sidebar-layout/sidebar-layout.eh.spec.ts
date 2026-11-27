import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { AppEvent, SidebarLayoutEvent } from 'src/app/event-types';
import { AppEventData } from 'src/app/types';
import { SidebarLayoutEH } from './sidebar-layout.eh';

type Tabs = { notebook?: boolean; ontologies?: boolean; page?: boolean };

describe('SidebarLayoutEH > tabs', () => {
  const setup = ({ notebook = false, ontologies = false, page = false }: Tabs = {}) => {
    const eh = new SidebarLayoutEH();
    eh.dataSource = {
      notebookEditor: new BehaviorSubject(notebook),
      ontologiesPanel: new BehaviorSubject(ontologies),
    } as any;
    eh.annotationService = { showPageAnnotations$: new BehaviorSubject(page) } as any;
    const events: AppEventData[] = [];
    eh.appEvent$ = new ReplaySubject<AppEventData>();
    eh.appEvent$.subscribe((event) => events.push(event));
    const handlers = (eh as any).innerEventHandlers;
    const state = () => ({
      notebook: eh.dataSource.notebookEditor.value,
      ontologies: eh.dataSource.ontologiesPanel.value,
      page: eh.annotationService.showPageAnnotations$.value,
    });
    return { handlers, events, state };
  };

  it('opens the ontologies panel and closes the notebook panel', () => {
    const { handlers, state } = setup({ notebook: true });
    handlers[SidebarLayoutEvent.ClickOntologiesPanel]();
    expect(state()).toEqual({ notebook: false, ontologies: true, page: false });
  });

  it('opens the notebook panel and closes the ontologies panel', () => {
    const { handlers, state } = setup({ ontologies: true });
    handlers[SidebarLayoutEvent.ClickNotebookPanel]();
    expect(state()).toEqual({ notebook: true, ontologies: false, page: false });
  });

  it('closes the ontologies panel on a second click', () => {
    const { handlers, state } = setup({ ontologies: true });
    handlers[SidebarLayoutEvent.ClickOntologiesPanel]();
    expect(state()).toEqual({ notebook: false, ontologies: false, page: false });
  });

  it.each([
    ['notebook', { notebook: true }],
    ['ontologies', { ontologies: true }],
  ])('shows the page annotations and closes the %s panel', (_name, tabs) => {
    const { handlers, state, events } = setup(tabs);
    handlers[SidebarLayoutEvent.ClickPageAnnotationPanel]();
    expect(state()).toEqual({ notebook: false, ontologies: false, page: true });
    expect(events).toEqual([{ type: AppEvent.ShowPageAnnotations }]);
  });

  it.each([
    ['notebook', SidebarLayoutEvent.ClickNotebookPanel, { notebook: true, ontologies: false, page: false }],
    ['ontologies', SidebarLayoutEvent.ClickOntologiesPanel, { notebook: false, ontologies: true, page: false }],
  ])('opens the %s panel and hides the page annotations', (_name, event, expected) => {
    const { handlers, state, events } = setup({ page: true });
    handlers[event]();
    expect(state()).toEqual(expected);
    expect(events).toEqual([{ type: AppEvent.HidePageAnnotations }]);
  });

  it('hides the page annotations on a second click', () => {
    const { handlers, state, events } = setup({ page: true });
    handlers[SidebarLayoutEvent.ClickPageAnnotationPanel]();
    expect(state()).toEqual({ notebook: false, ontologies: false, page: false });
    expect(events).toEqual([{ type: AppEvent.HidePageAnnotations }]);
  });

  it('closing a panel leaves the page annotations hidden and emits nothing', () => {
    const { handlers, state, events } = setup({ notebook: true });
    handlers[SidebarLayoutEvent.ClickNotebookPanel]();
    expect(state()).toEqual({ notebook: false, ontologies: false, page: false });
    expect(events).toEqual([]);
  });
});

describe('SidebarLayoutEH > add page annotation', () => {
  it('asks for a new page annotation of the clicked type', () => {
    const eh = new SidebarLayoutEH();
    const events: AppEventData[] = [];
    eh.appEvent$ = new ReplaySubject<AppEventData>();
    eh.appEvent$.subscribe((event) => events.push(event));
    (eh as any).innerEventHandlers[SidebarLayoutEvent.ClickNewFullPageAnnotation]('linking');
    expect(events).toEqual([{ type: AppEvent.AnnotationNewFullPage, payload: 'linking' }]);
  });
});

describe('SidebarLayoutEH > current notebook restored (design D7)', () => {
  it('redraws the notebook panel when the selection changes, until destroyed', () => {
    const eh = new SidebarLayoutEH();
    const selectedChanged$ = new Subject<void>();
    eh.notebookService = { selectedChanged$ } as any;
    eh.dataSource = { updateNotebookPanel: jest.fn() } as any;

    (eh as any).listenSelectedNotebookChanges();
    selectedChanged$.next();
    expect(eh.dataSource.updateNotebookPanel).toHaveBeenCalledTimes(1);

    eh.destroy$.next();
    selectedChanged$.next();
    expect(eh.dataSource.updateNotebookPanel).toHaveBeenCalledTimes(1);
  });
});
