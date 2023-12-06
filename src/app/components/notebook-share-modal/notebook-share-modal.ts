import { Component, Input } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookService, NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';

export type NotebookShareModalResult = {
  username: string;
  email: string;
  thumb: string;
  hideEmail?: boolean;
  action?: 'read' | 'write';
};

export type NotebookShareListItem = {
  id: string | number;
  username: string;
  thumb: string;
  role: NotebookUserRole;
  status: NotebookUserStatus;
  roleAsLabel: string;
  statusAsLabel: string;
  dropdown?: {
    actions: {
      label: string;
      payload: any;
    }[];
    isExpanded?: boolean;
  };
};

export type NotebookShareModalData = {
  visible: boolean;
  header: {
    label: string;
  };
  body: {
    formSection: {
      text: string;
      autocomplete: {
        input: {
          placeholder: string;
        };
        results?: NotebookShareModalResult[];
      };
    };
    listSection: {
      title: string;
      items: NotebookShareListItem[];
    };
    confirmSection?: {
      text: string;
      selected: NotebookShareModalResult;
    };
  };
  invitationsList: Map<string, NotebookShareModalResult>;
  actions: {
    label: string;
    payload: any;
    classes?: string;
  }[];
}

@Component({
  selector: 'pnd-notebook-share-modal',
  templateUrl: './notebook-share-modal.html'
})
export class NotebookShareModalComponent {
  @Input() data: NotebookShareModalData;

  @Input() emit: (type: string, payload?: unknown) => void;

  constructor(
    public imageDataService: ImageDataService,
    // Da togliere
    public notebookService: NotebookService
    // ---
  ) {}

  onClick(ev: Event, payload: any) {
    if (!this.emit) return;

    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-modal__overlay') {
      return;
    }
    this.emit('close');
  }

  onInput(payload) {
    if (!this.emit) return;

    this.emit('input', payload);
  }

  onAutocompleteClick(payload) {
    if (!this.emit) return;

    this.emit('autocompleteclick', payload);
  }

  onActionClick(payload) {
    if (!this.emit) return;

    this.emit('actionclick', payload);
  }

  dropdownToggle(item) {
    item.dropdown.isExpanded = !item.dropdown.isExpanded;
  }

  // Da togliere
  getData() {
    const currentNotebookId = this.notebookService.getSelected()?.id;
    return this.notebookService.getData(currentNotebookId).subscribe((response) => {
      console.warn(response.data);
    });
  }
  // ---
}
