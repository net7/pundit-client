import { _t } from '@n7-frontend/core';
import { PublicNotebook, SharingModeType } from '@pundit/communication';
import { NotebookPanelEvent } from 'src/app/events';
import { NotebookData, NotebookUpdate } from 'src/app/services/notebook.service';
import { LayoutHandler } from 'src/app/types';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';
import * as notebook from '../../../models/notebook';

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
          const {
            id,
            label,
            sharingMode,
            userId,
            type: newSharingMode
          } = payload;
          this.handleNotebookUpdate({
            id,
            label,
            sharingMode,
            userId
          }, { sharingMode: newSharingMode });
        } break;

        case NotebookPanelEvent.CreateNotebook: {
          // create default data for the new notebook
          const notebookData: PublicNotebook = {
            label: payload, // assign the chosen name
            sharingMode: 'public',
            userId: this.layoutEH.userService.whoami().id, // authentication
          };
          // create the notebook in the backend first to generate the id
          notebook.create({
            data: notebookData
          }).then((res) => {
            // use the received id to cache the new notebook
            this.layoutEH.notebookService.create({
              id: res.data.id,
              ...notebookData, // use the same data for the cache
              created: new Date(),
              changed: new Date(),
            });
            this.layoutEH.notebookService.setSelected(res.data.id); // select the new notebook
            this.layoutDS.updateNotebookPanel();
          }).catch((e) => console.error(e));
        } break;

        default:
          break;
      }

      this.layoutEH.detectChanges();
    });
  }

  private handleNotebookUpdate(nb: NotebookData, update: NotebookUpdate) {
    // update the backend version of the notebook
    const userId = this.layoutEH.userService.whoami().id;
    notebook.update(nb.id, {
      data: {
        userId,
        label: update.label ? update.label : nb.label,
        sharingMode: update.sharingMode ? update.sharingMode : (nb.sharingMode as SharingModeType),
        userWithReadAccess: [],
        userWithWriteAccess: [],
      }
    }).then(() => {
      // update the cached version of the notebook
      this.layoutEH.notebookService.update(nb.id, update);
      // toast
      this.layoutEH.toastService.success({
        title: _t('toast#notebookedit_success_title'),
        text: _t('toast#notebookedit_success_text'),
      });
    }).catch((err) => {
      // toast
      this.layoutEH.toastService.error({
        title: _t('toast#notebookedit_error_title'),
        text: _t('toast#notebookedit_error_text'),
      });
      console.warn('Notebook update error:', err);
    });
  }
}
