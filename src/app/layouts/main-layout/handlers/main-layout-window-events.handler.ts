import { _t } from '@n7-frontend/core';
import { AppEvent } from 'src/app/event-types';
import { StorageKey } from 'src/app/services/storage-service/storage.types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutWindowEventsHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) {}

  public listen() {
    window.addEventListener('rootelementexists', this.rootElExistsHandler, false);

    window.onfocus = () => {
      this.checkDefaultNotebook();
    };

    // on destroy remove event listeners
    this.layoutEH.destroy$.subscribe(() => {
      window.removeEventListener('rootelementexists', this.rootElExistsHandler);
    });
  }

  private rootElExistsHandler = () => {
    // toast
    this.layoutDS.toastService.info({
      title: _t('toast#rootelementexists_title'),
      text: _t('toast#rootelementexists_text'),
      autoClose: false
    });
  }

  private checkDefaultNotebook = () => {
    if (!this.layoutDS.userService.whoami()) {
      return;
    }

    this.layoutDS.storageService.get(StorageKey.Notebook).subscribe((notebookId) => {
      const defaultNotebook = this.layoutDS.notebookService.getSelected() || { id: null };
      if (notebookId !== defaultNotebook.id) {
        this.layoutDS.notebookService.setSelected(notebookId);
        this.layoutEH.appEvent$.next({
          type: AppEvent.SelectedNotebookChanged
        });
      }
    });
  }
}
