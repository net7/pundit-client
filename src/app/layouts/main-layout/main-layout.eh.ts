import { EventHandler } from '@n7-frontend/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, switchMapTo, takeUntil } from 'rxjs/operators';
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

    this.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'tooltip.highlight':
          this.dataSource.onHighlight();
          break;
        case 'tooltip.comment':
          console.warn('TODO: gestire comment event');
          break;
        default:
          break;
      }
    });
  }

  listenSelection() {
    const mouseDown$ = fromEvent(document, 'mousedown');
    const mouseUp$ = fromEvent(document, 'mouseup');
    const selectionChanged$ = selectionHandler.changed$;

    mouseDown$.pipe(
      switchMapTo(selectionChanged$),
      switchMapTo(mouseUp$),
      debounceTime(_c('tooltipDelay')),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dataSource.onSelectionChange();
      this.emitOuter('selectionchange', this.dataSource.hasSelection());
    });
  }
}
