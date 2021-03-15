import { Component, Input } from '@angular/core';
import { NotebookData } from '../../services/notebook.service';

export interface NotebookPanelData {
  selected: NotebookData;
  list: NotebookData[];
  labels: {
    [key: string]: any;
  };
  icons: string;
  isLoading?: boolean;
  _meta?: any;
}

@Component({
  selector: 'notebook-panel',
  templateUrl: './notebook-panel.html'
})
export class NotebookPanelComponent {
  @Input() public data: NotebookPanelData;

  @Input() public emit: any;

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    this.emit(type, payload);
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
