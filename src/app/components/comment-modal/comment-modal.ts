import {
  AfterContentChecked,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { Tag } from '@pundit/communication';
import * as Draggable from 'draggable';
import Tagify from '@yaireo/tagify';
import { TagService } from 'src/app/services/tag.service';
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

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  private tagify;

  constructor(private tagService: TagService) { }

  ngAfterContentChecked() {
    if (!this.loaded && this.data && this.data.visible) {
      this.loaded = true;

      // fix element dom loaded
      setTimeout(() => {
        if (this.data.form.tags.visible) {
          this.tagify = new Tagify(this.tagifyInputRef.nativeElement, this.setupTagForm());
          this.tagify.addTags([{ value: 'banana', color: 'yellow' }, { value: 'apple', color: 'red' }, { value: 'watermelon', color: 'green' }]);
        }
        const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
        const target = shadowRoot.getElementById(this.draggableTarget);
        const handle = shadowRoot.getElementById(this.draggableHandle);
        const limit = this.getDragLimit(target);
        this.draggableInstance = new Draggable(target, { handle, limit });
        this.data._setInstance(this.draggableInstance);
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

  private setupTagForm = () => ({
    // Validate typed tag(s)
    pattern: /^\w{1,128}$/,
    // add new tags when a comma or a space character is entered
    delimiters: ',| ',
    maxTags: 20,
    whitelist: ['tag1', 'tag2', 'tag3'], // use tagservice to fetch tags;
    transformTag: this.transformTag,
    backspace: 'edit',
    placeholder: 'Add a tag',
    dropdown: {
      enabled: 1, // show suggestion after 1 typed character
      fuzzySearch: false, // match only suggestions that starts with the typed characters
      position: 'text', // position suggestions list next to typed text
      caseSensitive: true, // allow adding duplicate items if their case is different
    },
  })

  // generate a random color (in HSL format, which I like to use)
  private getRandomColor = () => {
    const rand = (min, max) => min + Math.random() * (max - min);

    const h = Math.trunc(rand(1, 360));
    const s = Math.trunc(rand(40, 70));
    const l = Math.trunc(rand(65, 72));

    return `hsl(${h},${s}%,${l}%)`;
  }

  private transformTag = (tagData) => {
    tagData.style = `--tag-bg:${this.getRandomColor()}`;
  }
}
