import { fromEvent, Subject } from 'rxjs';

/**
 * Handles document selectionchange event
 * keeping the last selection (currentSelection) and
 * sends a signal (changed$) when the event occurs
 */
class SelectionHandler {
  public changed$: Subject<any> = new Subject();

  private currentSelection: Selection;

  private currentRange: Range;

  constructor() {
    this.listen();
  }

  public getCurrentSelection() {
    return this.currentSelection;
  }

  public getCurrentRange() {
    return this.currentRange;
  }

  private listen() {
    const source$ = fromEvent(document, 'selectionchange');
    source$.subscribe(() => {
      this.onSelectionChange();
    });
  }

  private onSelectionChange() {
    this.currentSelection = null;
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        this.currentSelection = selection;
        this.currentRange = range;
        this.changed$.next();
      }
    }
  }
}

export const selectionHandler: SelectionHandler = new SelectionHandler();
