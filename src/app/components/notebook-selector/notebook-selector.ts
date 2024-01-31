import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { _t } from '@net7/core';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';

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
    private ref: ChangeDetectorRef,
    private notebookService: NotebookService
  ) {}

  onClick(type, payload) {
    if (!this.emit) return;
    if (payload === 'createmode') {
      this.setMode('input');
      return;
    } if (payload === 'createnotebook') {
      this.setMode('select');
    } else {
      // if a notebook option is clicked
      this.data.selectedNotebook = this.data.notebookList.find((nb) => nb.id === payload);
      this.notebookService.getListOfUsers();
    }
    // collapse the list of notebooks
    this.data._meta.isExpanded = false;
    this.emit(type, payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  onToggleExpand() {
    if (!this.data._meta) {
      this.data._meta = { isExpanded: false };
    } else if (!this.data._meta.isExpanded) {
      this.data._meta.isExpanded = false;
    }
    this.data._meta.isExpanded = !this.data._meta.isExpanded;
    // trigger change detector
    this.ref.detectChanges();
  }

  /**
   * When pressing the "create new notebook" button.
   */
  onInputMode() {
    this.setMode('input');

    // trigger change detector
    this.ref.detectChanges();
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
      this.setMode('select');
      this.onToggleExpand();
    }

    // trigger change detector
    this.ref.detectChanges();
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

    // trigger change detector
    this.ref.detectChanges();
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

      // trigger change detector
      this.ref.detectChanges();
    }
  }

  private setMode(mode: 'input' | 'select') {
    this.data.mode = mode;

    // signal
    this.emit('modechanged', mode);
  }
}
