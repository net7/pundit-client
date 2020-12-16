import { EventHandler } from '@n7-frontend/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { MainLayoutDS } from './main-layout.ds';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  public dataSource: MainLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'main-layout.init':
          this.dataSource.onInit();
          this.listenSelection();
          break;

        case 'main-layout.destroy':
          this.destroy$.next();
          break;
        default:
          break;
      }
    });

    /* this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        default:
          break;
      }
    }); */
  }

  listenSelection() {
    selectionHandler.changed$.pipe(
      debounceTime(_c('tooltipDelay')),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dataSource.onSelectionChange();
    });
  }
}
