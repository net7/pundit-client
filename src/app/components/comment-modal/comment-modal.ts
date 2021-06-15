import {
  AfterContentChecked,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { Tag } from '@pundit/communication';
import * as Draggable from 'draggable';
import { NotebookSelectorData } from '../notebook-selector/notebook-selector';

/**
 * Interface for CommentModal's "data"
 */
export interface CommentModalData {
  textQuote: string;
  visible: boolean;
  header: {
    label: string;
  };
  form: {
    comment: {
      visible: boolean;
      value: string;
    };
    tags: {
      visible: boolean;
      values: Tag[];
    };
    notebookSelectorData: NotebookSelectorData;
    actions: {
      label: string;
      payload: any;
      classes?: string;
      disabled?: boolean;
    }[];
  };
  _setInstance: (instance: any) => void;
  _setupTagForm: (instance: any, tags?: any) => void;
}

@Component({
  selector: 'pnd-comment-modal',
  templateUrl: './comment-modal.html'
})
export class CommentModalComponent implements AfterContentChecked {
  @ViewChild('saveButton') saveButton: ElementRef;

  @ViewChild('tagifyInputRef') tagifyInputRef: ElementRef<HTMLInputElement>;

  @Input() public data: CommentModalData;

  @Input() public emit: (type: string, payload?: any) => void;

  private loaded = false;

  private tagFormLoaded = false;

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  private formInstance;

  ngAfterContentChecked() {
    this.initDraggableInstance();
    this.initTagForm();
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

  onKeyEvent(ev: KeyboardEvent) {
    ev.stopImmediatePropagation();
    const { key } = ev;
    if (key === 'Tab') {
      const saveButtonEl = this.saveButton.nativeElement as HTMLButtonElement;
      if (!saveButtonEl.disabled) {
        setTimeout(() => {
          saveButtonEl.focus();
        });
      }
    }
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit('close');
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    this.emit(type, payload);
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
        this.data._setInstance(this.draggableInstance);
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

  private initTagForm = () => {
    if (!this.tagFormLoaded && this.data?.visible && this.data?.form?.tags?.visible) {
      this.tagFormLoaded = true;
      setTimeout(() => {
        this.formInstance = this.data._setupTagForm(this.tagifyInputRef.nativeElement,
          this.data.form.tags.values);
        this.formInstance.on(
          'add remove edit:updated',
          () => {
            setTimeout(() => {
              const elements = this.formInstance.getTagElms();
              this.emit('tagschange', elements.map((el) => el.innerText));
            });
          }
        );
      });
    }
  }
}
