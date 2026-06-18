import { ChangeDetectorRef, Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { _t } from '@net7/core';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { NgTemplateOutlet, NgClass } from '@angular/common';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { SortByPipe } from '../../pipes/sortby.pipe';

/**
 * Data for NotebookSelector Component.
 */
export interface NotebookSelectorData {
  /** ID of the default selected notebook */
  selectedNotebook: NotebookData | null;
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
    templateUrl: './notebook-selector.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, SvgIconComponent, NgClass, SortByPipe]
})
export class NotebookSelectorComponent {
  private ref = inject(ChangeDetectorRef);
  private notebookService = inject(NotebookService);

  @Input() public data!: NotebookSelectorData;

  @Input() public emit: any;

  labels = {
    cancel: _t('notebookselector#cancel'),
    create: _t('notebookselector#create')
  };

  onClick(type: string, payload: any) {
    if (!this.emit) return;
    if (payload === 'createmode') {
      this.setMode('input');
      return;
    } if (payload === 'createnotebook') {
      this.setMode('select');
    } else {
      // if a notebook option is clicked
      this.updateData({
        selectedNotebook: this.data.notebookList.find((nb) => nb.id === payload) || null
      });
      this.notebookService.getListOfUsers();
    }
    // collapse the list of notebooks
    this.updateMeta({ isExpanded: false });
    this.emit(type, payload);

    // trigger change detector
    this.ref.markForCheck();
  }

  onToggleExpand() {
    this.updateMeta({ isExpanded: !this.data._meta?.isExpanded });
    // trigger change detector
    this.ref.markForCheck();
  }

  /**
   * When pressing the "create new notebook" button.
   */
  onInputMode() {
    this.setMode('input');

    // trigger change detector
    this.ref.markForCheck();
  }

  /**
   * When pressing the "save new notebook" button.
   * @param payload Label of the newly created notebook.
   */
  onCreation(payload: any) {
    if (!this.emit) return;
    if (typeof payload === 'string' && payload.trim().length > 0) {
      this.emit('createnotebook', payload.trim());
    } else {
      this.setMode('select');
      this.onToggleExpand();
    }

    // trigger change detector
    this.ref.markForCheck();
  }

  /**
   * When typing the new name of the notebook
   * @param payload Name of the new notebook
   */
  onInput(payload: any) {
    this.updateMeta({ inputValue: payload });

    // trigger change detector
    this.ref.markForCheck();
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
      this.ref.markForCheck();
    }
  }

  private setMode(mode: 'input' | 'select') {
    this.updateData({ mode });

    // signal
    this.emit('modechanged', mode);
  }

  private updateData(data: Partial<NotebookSelectorData>) {
    this.data = {
      ...this.data,
      ...data
    };
  }

  private updateMeta(meta: Record<string, unknown>) {
    this.updateData({
      _meta: {
        ...this.data._meta,
        ...meta
      }
    });
  }
}
