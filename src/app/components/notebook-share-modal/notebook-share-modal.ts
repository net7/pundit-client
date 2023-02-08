import { Component, Input } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';

export type NotebookShareModalResult = {
  username: string;
  email: string;
  thumb: string;
};

export type NotebookShareListItem = {
  id: string | number;
  username: string;
  thumb: string;
  roleAsLabel: string;
  role: NotebookUserRole;
  status: NotebookUserStatus;
  dropdown?: {
    label: string;
    actions: {
      label: string;
      payload: any;
    }[];
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
    public imageDataService: ImageDataService
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
}
