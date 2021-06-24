import {
  AfterContentChecked,
  Component,
  Input,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FormSectionData } from 'src/app/types';
import * as Draggable from 'draggable';
import { merge } from 'rxjs';
import { isEmpty } from 'lodash';

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
    cancel: EditModalAction;
    save: EditModalAction;
  };
  _setDraggableInstance: (instance: any) => void;
}

export type EditModalAction = {
  label: string;
  classes?: string;
  disabled?: boolean;
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

  private formState: FormState = {};

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  ngAfterContentChecked() {
    this.init();
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit('close');
  }

  onSave() {
    this.emit('save', this.formState);
  }

  private init = () => {
    if (!this.loaded && this.data?.visible) {
      this.loaded = true;

      // init draggable
      this.initDraggableInstance();
      // init changed$ listener
      this.initChangedListener();
    }
  }

  private initDraggableInstance = () => {
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

  private initChangedListener = () => {
    // TODO
    const { sections } = this.data;
    const sources$ = Object.keys(sections)
      .map((key) => sections[key].changed$);

    // listen to sections changed$
    merge(...sources$).subscribe(({ id, value, errors }) => {
      this.formState[id] = { value, errors };

      // update save button state
      this.updateSaveButtonState();
    });
  }

  private updateSaveButtonState() {
    const { sections } = this.data;
    let disabled = false;
    Object.keys(sections).forEach((key) => {
      // check for errors
      const sectionErrors = this.formState[key]?.errors;
      if (Array.isArray(sectionErrors) && sectionErrors.length) {
        disabled = true;
      }

      // check required
      const sectionValue = this.formState[key]?.value;
      if (sections[key].required && isEmpty(sectionValue)) {
        disabled = true;
      }
    });

    // update save button
    const saveAction = this.data.actions.save;
    saveAction.disabled = disabled;
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
