import { BehaviorSubject } from 'rxjs';
import { SidebarLayoutEvent } from 'src/app/event-types';
import { SidebarLayoutEH } from './sidebar-layout.eh';

describe('SidebarLayoutEH > panels', () => {
  const setup = (notebookOpen: boolean, ontologiesOpen: boolean) => {
    const eh = new SidebarLayoutEH();
    eh.dataSource = {
      notebookEditor: new BehaviorSubject(notebookOpen),
      ontologiesPanel: new BehaviorSubject(ontologiesOpen),
    } as any;
    const handlers = (eh as any).innerEventHandlers;
    return { eh, handlers };
  };

  it('opens the ontologies panel and closes the notebook panel', () => {
    const { eh, handlers } = setup(true, false);
    handlers[SidebarLayoutEvent.ClickOntologiesPanel]();
    expect(eh.dataSource.ontologiesPanel.value).toBe(true);
    expect(eh.dataSource.notebookEditor.value).toBe(false);
  });

  it('opens the notebook panel and closes the ontologies panel', () => {
    const { eh, handlers } = setup(false, true);
    handlers[SidebarLayoutEvent.ClickNotebookPanel]();
    expect(eh.dataSource.notebookEditor.value).toBe(true);
    expect(eh.dataSource.ontologiesPanel.value).toBe(false);
  });

  it('closes the ontologies panel on a second click', () => {
    const { eh, handlers } = setup(false, true);
    handlers[SidebarLayoutEvent.ClickOntologiesPanel]();
    expect(eh.dataSource.ontologiesPanel.value).toBe(false);
  });
});
