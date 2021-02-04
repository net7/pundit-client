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
  /** Internal data */
  _meta?: any;
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

    if (payload === 'createmode') {
      this.data.mode = 'input';
      return;
    } if (payload === 'createnotebook') {
      this.data.mode = 'select';
    }

    this.emit(type, payload);
  }

  /**
   * When pressing the "create new notebook" button.
   */
  onInputMode() {
    this.data.mode = 'input';
  }

  /**
   * When pressing the "save new notebook" button.
   * @param payload Label of the newly created notebook.
   */
  onCreation(payload) {
    if (!this.emit) return;
    this.data.mode = 'select';
    this.emit('createnotebook', payload);
  }

  /**
   * When typing the new name of the notebook
   * @param payload Name of the new notebook
   */
  onInput(payload) {
    if (!this.data._meta) {
      this.data._meta = {};
    }
    this.data._meta.inputValue = payload;
  }
}
