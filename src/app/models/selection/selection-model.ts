import { fromEvent, Subject } from 'rxjs';
import { getHostDocument } from '../annotation/html-util/getHostDocument';

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
    const hostDocument = this.getListenToElement();
    if (hostDocument.getSelection) {
      if (hostDocument.getSelection().empty) { // Chrome
        hostDocument.getSelection().empty();
      } else if (hostDocument.getSelection().removeAllRanges) { // Firefox
        hostDocument.getSelection().removeAllRanges();
      }
    } else if ((hostDocument as any).selection) { // IE?
      (hostDocument as any).selection.empty();
    }
  }

  private listen() {
    const source$ = fromEvent(document, 'selectionchange');
    source$.subscribe(() => {
      this.onSelectionChange();
    });
  }

  public setSelectionFromRange(range: Range) {
    const hostDocument = this.getListenToElement();
    const newSelection = hostDocument.getSelection();
    const newRange = hostDocument.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.endContainer, range.endOffset);
    newSelection.removeAllRanges();
    newSelection.addRange(newRange);
    // update current
    this.onSelectionChange();
  }

  private onSelectionChange() {
    const hostDocument = this.getListenToElement();
    this.currentSelection = null;
    this.currentRange = null;
    const selection = hostDocument.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        this.currentSelection = selection;
        this.currentRange = range;
      }
    }
    this.changed$.next();
  }

  private getListenToElement(): Document {
    const el = getHostDocument();
    if (el instanceof ShadowRoot) {
      return el as any;
    }
    return document;
  }
}

export const selectionModel: SelectionModel = new SelectionModel();
