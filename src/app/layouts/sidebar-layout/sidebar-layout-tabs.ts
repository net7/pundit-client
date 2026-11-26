import { AppEvent } from 'src/app/event-types';
import type { SidebarLayoutEH } from './sidebar-layout.eh';

export type SidebarTab = 'notebook' | 'ontologies' | 'page';

/** Exclusive header tabs of the sidebar: notebooks, ontologies, page annotations */
export class SidebarLayoutTabs {
  constructor(private layoutEH: SidebarLayoutEH) {}

  /** Open the tab and close the other ones, or close it when it is already open */
  toggle(tab: SidebarTab) {
    const open = !this.isOpen(tab);
    if (tab === 'page' || open) this.setPageAnnotations(tab === 'page' && open);
    this.layoutEH.dataSource.notebookEditor.next(tab === 'notebook' && open);
    this.layoutEH.dataSource.ontologiesPanel.next(tab === 'ontologies' && open);
  }

  private isOpen(tab: SidebarTab): boolean {
    const { dataSource, annotationService } = this.layoutEH;
    if (tab === 'notebook') return dataSource.notebookEditor.getValue();
    if (tab === 'ontologies') return dataSource.ontologiesPanel.getValue();
    return annotationService.showPageAnnotations$.getValue();
  }

  /** Show or hide the page annotations, without repeating the event when nothing changes */
  private setPageAnnotations(show: boolean) {
    const { annotationService, appEvent$ } = this.layoutEH;
    if (annotationService.showPageAnnotations$.getValue() === show) return;
    annotationService.showPageAnnotations$.next(show);
    appEvent$.next({
      type: show ? AppEvent.ShowPageAnnotations : AppEvent.HidePageAnnotations
    });
  }
}
