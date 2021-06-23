import {
  AfterContentChecked,
  Component,
  Input,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FormSectionData } from 'src/app/types';
import * as Draggable from 'draggable';

/**
 * Interface for EditModal's "data"
 */
export interface EditModalData {
  textQuote: string;
  visible: boolean;
  header: {
    label: string;
  };
  sections: {
    [id: string]: FormSectionData<unknown, unknown>;
  };
  actions: {
    label: string;
    payload: any;
    classes?: string;
    disabled?: boolean;
  }[];
  _setDraggableInstance: (instance: any) => void;
}

export type FormState = {
  [id: string]: {
    value: unknown;
    errors: string[];
  };
}

@Component({
  selector: 'pnd-edit-modal',
  templateUrl: './edit-modal.html'
})
export class EditModalComponent implements AfterContentChecked {
  @ViewChild('saveButton') saveButton: ElementRef;

  @Input() public data: EditModalData;

  @Input() public emit: (type: string, payload?: any) => void;

  private loaded = false;

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  ngAfterContentChecked() {
    this.initDraggableInstance();
  }

  onClick(ev: Event, payload: any) {
    if (!this.emit) {
      return;
    }
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit('close');
  }

  private initDraggableInstance = () => {
    if (!this.loaded && this.data?.visible) {
      this.loaded = true;
      // fix element dom loaded
      setTimeout(() => {
        const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
        const target = shadowRoot.getElementById(this.draggableTarget);
        const handle = shadowRoot.getElementById(this.draggableHandle);
        const limit = this.getDragLimit(target);
        this.draggableInstance = new Draggable(target, { handle, limit });
        this.data._setDraggableInstance(this.draggableInstance);
      });
    }
  }

  private getDragLimit = (target) => {
    if (!target) {
      return null;
    }
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const tw = Math.max(target.clientWidth || 200);
    const th = Math.max(target.clientHeight || 200);
    return { x: [0, vw - tw], y: [0, vh - th] };
  }
}
