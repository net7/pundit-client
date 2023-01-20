import { Component, Input } from '@angular/core';

/**
 * Interface for PdfErrorModal's "data"
 */
export interface PdfErrorModalData {
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
  selector: 'pnd-pdf-error-modal',
  templateUrl: './pdf-error-modal.html'
})
export class PdfErrorModalComponent {
  @Input() public data: PdfErrorModalData;

  @Input() public emit: (type: string, payload?: any) => void;

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
