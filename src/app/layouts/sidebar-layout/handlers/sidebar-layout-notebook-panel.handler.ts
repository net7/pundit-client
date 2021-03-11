import { _t } from '@n7-frontend/core';
import { NotebookPanelEvent } from 'src/app/event-types';
import { NotebookUpdate } from 'src/app/services/notebook.service';
import { LayoutHandler } from 'src/app/types';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

export class SidebarLayoutNotebookPanelHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookPanelEvent.ChangeSelected: // change the default notebook
          this.layoutEH.notebookService.setSelected(payload);
          this.layoutDS.updateNotebookPanel();
          // toast
          this.layoutEH.toastService.success({
            title: _t('toast#notebookchangecurrent_success_title'),
            text: _t('toast#notebookchangecurrent_success_text'),
          });
          break;

        case NotebookPanelEvent.EditSharingMode: { // change sharing mode for the notebook
          const { id, type: newSharingMode } = payload;
          this.handleNotebookUpdate(id, { sharingMode: newSharingMode });
        } break;

        case NotebookPanelEvent.CreateNotebook:
          // creates notebook
          this.layoutEH.notebookService.create(payload).pipe(
            catchError((err) => {
              console.error(err);
              // toast
              this.layoutEH.toastService.error({
                title: _t('toast#notebookchangecurrent_error_title'),
                text: _t('toast#notebookchangecurrent_error_text'),
              });
              return EMPTY;
            })
          ).subscribe(({ data }) => {
            this.layoutEH.notebookService.setSelected(data.id); // select the new notebook
            this.layoutDS.updateNotebookPanel();
            // toast
            this.layoutEH.toastService.success({
              title: _t('toast#notebookchangecurrent_success_title'),
              text: _t('toast#notebookchangecurrent_success_text'),
            });
          });
          break;

        default:
          break;
      }

      this.layoutEH.detectChanges();
    });
  }

  /**
   * Request an update of the notebook on the back-end.
   *
   * @param notebookId notebook id
   * @param updateData modifications to the original notebook
   */
  private handleNotebookUpdate(notebookId: string, updateData: NotebookUpdate) {
    // update the backend version of the notebook
    this.layoutEH.notebookService.update(notebookId, updateData).pipe(
      catchError((err) => {
        console.warn('Notebook update error:', err);
        // toast
        this.layoutEH.toastService.error({
          title: _t('toast#notebookedit_error_title'),
          text: _t('toast#notebookedit_error_text'),
        });
        return EMPTY;
      })
    ).subscribe(() => {
      // toast
      this.layoutEH.toastService.success({
        title: _t('toast#notebookedit_success_title'),
        text: _t('toast#notebookedit_success_text'),
      });
    });
  }
}
