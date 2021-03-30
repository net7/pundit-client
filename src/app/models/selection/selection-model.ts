import { fromEvent, Subject } from 'rxjs';

/**
 * Handles document selectionchange event
 * keeping the last selection (currentSelection) and
 * sends a signal (changed$) when the event occurs
 */
class SelectionModel {
  public changed$: Subject<any> = new Subject();

  private currentSelection: Selection | null;

  private currentRange: Range | null;

  constructor() {
    this.listen();
  }

  public getCurrentSelection() {
    return this.currentSelection;
  }

  public getCurrentRange() {
    return this.currentRange;
  }

  public clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) { // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) { // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if ((document as any).selection) { // IE?
      (document as any).selection.empty();
    }
  }

  private listen() {
    const source$ = fromEvent(document, 'selectionchange');
    source$.subscribe(() => {
      this.onSelectionChange();
    });
  }

  public setSelectionFromRange(range: Range) {
    const newSelection = window.getSelection();
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.endContainer, range.endOffset);
    newSelection.removeAllRanges();
    newSelection.addRange(newRange);
    // update current
    this.onSelectionChange();
  }

  private onSelectionChange() {
    this.currentSelection = null;
    this.currentRange = null;
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        this.currentSelection = selection;
        this.currentRange = range;
      }
    }
    this.changed$.next();
  }
}

export const selectionModel: SelectionModel = new SelectionModel();
