import {
  Component, Input
} from '@angular/core';
import { Icon } from '@n7-frontend/components';

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
          payload: any;
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
export class CommentModalComponent {
  @Input() public data: CommentModalData;

  @Input() public emit: (type: string, payload?: any) => void;

  onClick(ev: Event, payload: any) {
    if (!this.emit) {
      return;
    }
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onChange(payload) {
    if (!this.emit) {
      return;
    }
    this.emit('change', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit('close');
  }
}
