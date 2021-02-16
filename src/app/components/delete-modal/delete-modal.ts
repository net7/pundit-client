import { Component, Input } from '@angular/core';

/**
 * Interface for DeleteModal's "data"
 */
export interface DeleteModalData {
  visible: boolean;
  header: {
    label: string;
  };
  body: {
    text: string;
  };
  actions: {
    label: string;
    payload: any;
    classes?: string;
  }[];
}

@Component({
  selector: 'pnd-delete-modal',
  templateUrl: './delete-modal.html'
})
export class DeleteModalComponent {
  @Input() public data: DeleteModalData;

  @Input() public emit: (type: string, payload?: any) => void;

  onClick(ev: Event, payload: any) {
    if (!this.emit) {
      return;
    }
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-delete-modal__overlay') {
      return;
    }
    this.emit('close');
  }
}
