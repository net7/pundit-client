import { Component, Input } from '@angular/core';

export type NotebookShareModalData = {
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
  selector: 'pnd-notebook-share-modal',
  templateUrl: './notebook-share-modal.html'
})
export class NotebookShareModalComponent {
  @Input() data: NotebookShareModalData;

  @Input() emit: (type: string, payload?: unknown) => void;

  onClick(ev: Event, payload: any) {
    if (!this.emit) {
      return;
    }
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-modal__overlay') {
      return;
    }
    this.emit('close');
  }
}
