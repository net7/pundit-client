import { ChangeDetectorRef, Component, Input } from '@angular/core';

/**
 * Represents a notebook item inside
 * of the select element.
 */
type NotebookOption = {
  /** internal ID of the notebook */
  id: string;
  /** Label to display as an option */
  label: string;
}

/**
 * Data for NotebookSelector Component.
 */
export interface NotebookSelectorData {
  /** ID of the default selected notebook */
  selectedNotebook: string;
  /** Data for the list of notebooks */
  notebookList: NotebookOption[];
  /** Data for the contextual notebook creation */
  createOption: {
    /** onChange value */
    value: any;
    /** Label to display as an option */
    label: string;
  };

  mode: 'select' | 'input';
}

@Component({
  selector: 'notebook-selector',
  templateUrl: './notebook-selector.html'
})

export class NotebookSelectorComponent {
  @Input() public data: NotebookSelectorData;

  @Input() public emit: any;

  constructor(
    private ref: ChangeDetectorRef
  ) {}

  onClick(type, payload) {
    if (!this.emit) return;
    this.emit('click', { ...payload, type });
  }

  onChange(payload) {
    if (!this.emit) return;
    this.emit('change', payload);
  }
}
