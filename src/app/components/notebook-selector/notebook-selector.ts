import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { _t } from '@n7-frontend/core';
import { NotebookData } from 'src/app/services/notebook.service';

/**
 * Data for NotebookSelector Component.
 */
export interface NotebookSelectorData {
  /** ID of the default selected notebook */
  selectedNotebook: NotebookData;
  /** Data for the list of notebooks */
  notebookList: NotebookData[];
  /** Data for the contextual notebook creation */
  createOption?: {
    /** onChange value */
    value: any;
    /** Label to display as an option */
    label: string;
  };
  mode: 'select' | 'input';
  isLoading?: boolean;
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

  labels = {
    cancel: _t('notebookselector#cancel'),
    create: _t('notebookselector#create')
  };

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
    } else {
      // if a notebook option is clicked
      this.data.selectedNotebook = this.data.notebookList.find((nb) => nb.id === payload);
    }
    // collapse the list of notebooks
    this.data._meta.isExpanded = false;
    this.emit(type, payload);
  }

  onToggleExpand() {
    if (!this.data._meta) {
      this.data._meta = { isExpanded: false };
    } else if (!this.data._meta.isExpanded) {
      this.data._meta.isExpanded = false;
    }
    this.data._meta.isExpanded = !this.data._meta.isExpanded;
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
    if (typeof payload === 'string' && payload.trim().length > 0) {
      this.emit('createnotebook', payload.trim());
    } else {
      this.data.mode = 'select';
      this.onToggleExpand();
    }
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

  /** Listen for enter key press */
  onKeyUp(payload: KeyboardEvent) {
    if (!this.emit) return;
    if (payload.key === 'Enter') {
      // get the full input string
      const label = this.data._meta.inputValue;
      if (label) {
        // create a new notebook with this label
        this.onCreation(this.data._meta.inputValue);
      }
    }
  }
}
