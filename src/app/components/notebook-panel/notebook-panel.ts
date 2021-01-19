import { ChangeDetectorRef, Component, Input } from '@angular/core';

export interface NotebookPanelData {
  active: string;
  status: 'public' | 'private' | 'shared';
  list: string[];
  description: string;
}

@Component({
  selector: 'notebook-panel',
  templateUrl: './notebook-panel.html'
})
export class NotebookPanelComponent {
  @Input() public data: NotebookPanelData;

  @Input() public emit: any;

  constructor(
    private ref: ChangeDetectorRef
  ) {
    // fix update out of pnd-root context
    // tooltipHandler.changed$.pipe(
    //   delay(1)
    // ).subscribe(() => {
    //   this.ref.detectChanges();
    // });
  }

  // onMouseDown(ev: MouseEvent) {
  //   ev.preventDefault();
  // }

  // navEmit = (type, payload) => {
  //   if (!this.emit) return;
  //   this.emit(type, payload);
  // }
}
