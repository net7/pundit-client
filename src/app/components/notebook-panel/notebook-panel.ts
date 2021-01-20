import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { NotebookData } from '../../services/notebook.service';

export interface NotebookPanelData {
  selected: NotebookData;
  list: NotebookData[];
  description: string;
  icon: string;
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

  onClick(type, payload) {
    if (!this.emit) return;
    this.emit('click', { ...payload, type });
  }

  onChange(payload) {
    if (!this.emit) return;
    this.emit('change', payload);
  }
}
