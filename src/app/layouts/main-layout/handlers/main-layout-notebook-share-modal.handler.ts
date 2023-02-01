import { delay } from 'rxjs/operators';
import { NotebookShareModalEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutNotebookShareModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    // FIXME: togliere
    this.layoutDS.userService.logged$.pipe(
      delay(3000)
    ).subscribe(() => {
      const notebook = this.layoutDS.notebookService.getSelected();
      console.log('notebook--------------->', notebook);
      this.layoutDS.one('notebook-share-modal').update(notebook);
    });

    // listen for modal events
    this.layoutEH.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case NotebookShareModalEvent.Confirm:
          break;
        case NotebookShareModalEvent.Click:
          break;
        case NotebookShareModalEvent.Close:
          break;
        default:
          break;
      }
    });
  }
}
