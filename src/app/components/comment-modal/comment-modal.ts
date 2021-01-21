import {
  AfterContentChecked,
  Component, Input
} from '@angular/core';
import { Icon } from '@n7-frontend/components';
import * as Draggable from 'draggable';

/**
 * Interface for CommentModal's "data"
 */
export interface CommentModalData {
  visible: boolean;
  header: {
    label: string;
  };
  form: {
    comment: {
      value: string | null;
    };
    notebooks: {
      label: string;
      select: {
        header: {
          label: string;
          icon: Icon;
          payload: any;
        };
        items: {
          label: string;
          id: string;
        }[];
        classes?: string;
      };
    };
    actions: {
      label: string;
      payload: any;
      classes?: string;
    }[];
  };
}

@Component({
  selector: 'pnd-comment-modal',
  templateUrl: './comment-modal.html'
})
export class CommentModalComponent implements AfterContentChecked {
  @Input() public data: CommentModalData;

  @Input() public emit: (type: string, payload?: any) => void;

  private loaded = false;

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  ngAfterContentChecked() {
    if (!this.loaded && this.data && this.data.visible) {
      this.loaded = true;

      // fix element dom loaded
      setTimeout(() => {
        const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
        const target = shadowRoot.getElementById(this.draggableTarget);
        const handle = shadowRoot.getElementById(this.draggableHandle);

        this.draggableInstance = new Draggable(target, { handle });
      });
    }
  }

  onClick(ev: Event, payload: any) {
    if (!this.emit) {
      return;
    }
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onChange(type, payload) {
    if (!this.emit) {
      return;
    }
    this.emit(type, payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit('close');
  }
}
