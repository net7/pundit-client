import { fromEvent } from 'rxjs';
import { debounceTime, switchMapTo, takeUntil } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { DocumentEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutSelectionHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    const mouseDown$ = fromEvent(document, DocumentEvent.MouseDown);
    const mouseUp$ = fromEvent(document, DocumentEvent.MouseUp);
    const selectionChanged$ = selectionModel.changed$;

    mouseDown$.pipe(
      switchMapTo(selectionChanged$),
      switchMapTo(mouseUp$),
      debounceTime(_c('tooltipDelay')),
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(() => {
      this.onSelectionChange();
      this.layoutEH.emitOuter(
        getEventType(MainLayoutEvent.SelectionChange),
        this.hasSelection()
      );
    });
  }

  private hasSelection = () => !!selectionModel.getCurrentSelection();

  private onSelectionChange() {
    if (this.hasSelection()) {
      tooltipModel.show(selectionModel.getCurrentSelection());
    } else {
      tooltipModel.hide();
    }
  }
}
