import { fromEvent, Subject } from 'rxjs';

class SelectionHandler {
  public changed$: Subject<any> = new Subject();

  constructor() {
    this.listen();
  }

  private listen() {
    const source$ = fromEvent(document, 'selectionchange');
    source$.subscribe(() => {
      this.onSelectionChange();
    });
  }

  private onSelectionChange() {
    let result: Range | null = null;
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        result = range;
      }
    }
    this.changed$.next(result);
  }
}

export const selectionHandler: SelectionHandler = new SelectionHandler();
