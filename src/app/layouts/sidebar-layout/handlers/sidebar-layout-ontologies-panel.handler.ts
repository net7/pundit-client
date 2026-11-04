import { _t } from '@net7/core';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OntologiesPanelEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

export class SidebarLayoutOntologiesPanelHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      if (type === OntologiesPanelEvent.Toggle) {
        this.layoutDS.ontologyService.toggle(payload);
      } else if (type === OntologiesPanelEvent.ToggleCategory) {
        this.layoutDS.ontologyService.toggleCategory(payload.id, payload.category);
      }
    });

    // the layout init (services included) runs before the handlers listen
    this.listenOntologies();
  }

  private listenOntologies() {
    const { ontologyService } = this.layoutDS;

    combineLatest([
      ontologyService.ontologies$, ontologyService.status$, ontologyService.savingIds$
    ]).pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(([ontologies, status, savingIds]) => {
      this.layoutDS.updateOntologiesPanel(ontologies, status, savingIds);
      // the list was cleared (logout)
      if (status === 'idle') {
        this.layoutDS.ontologiesPanel.next(false);
      }
      this.layoutEH.detectChanges();
    });

    ontologyService.openPanel$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(() => {
      this.layoutDS.isCollapsed.next(false);
      this.layoutDS.notebookEditor.next(false);
      this.layoutDS.ontologiesPanel.next(true);
      this.layoutEH.detectChanges();
    });

    ontologyService.saveError$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(() => {
      this.layoutEH.toastService.error({
        title: _t('toast#ontologies_save_error_title'),
        text: _t('toast#ontologies_save_error_text'),
      });
      this.layoutEH.detectChanges();
    });
  }
}
