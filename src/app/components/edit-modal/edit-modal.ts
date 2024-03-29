import {
  AfterContentChecked,
  Component,
  Input,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FormSectionData } from 'src/app/types';
import * as Draggable from 'draggable';
import { merge, Subject } from 'rxjs';
import { isEmpty } from 'lodash';
import { EditModalEvent, getEventType } from 'src/app/event-types';

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
  validation?: {
    required?: {
      condition: 'AND' | 'OR';
    };
  };
  hideActions?: boolean;
  _setDraggableInstance: (instance: any) => void;
  _internalId: string;
}

export type EditModalAction = {
  label: string;
  classes?: string;
  disabled?: boolean;
}

export type EditModalFormState = {
  [id: string]: {
    value: unknown;
    errors?: string[];
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

  private lastInternalId: string = null;

  private loaded = false;

  private formState: EditModalFormState = {};

  public draggableTarget = 'pnd-modal-draggable-target';

  public draggableHandle = 'pnd-modal-draggable-handle';

  public draggableInstance;

  public reset$: Subject<void> = new Subject();

  ngAfterContentChecked() {
    this.init();
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-comment-modal__overlay') {
      return;
    }
    this.emit(getEventType(EditModalEvent.Close));
  }

  onSave() {
    this.emit(getEventType(EditModalEvent.Save), this.formState);
  }

  private init = () => {
    // if modal is already loaded check for unique id
    // generated by edit-modal.ds transform
    if (this.data?._internalId && (this.data?._internalId !== this.lastInternalId)) {
      this.lastInternalId = this.data?._internalId;
      this.loaded = false;
      // symbolic timeout to wait
      // for data refresh
      setTimeout(() => {
        this.reset$.next();
      });
    }
    if (!this.loaded && this.data?.visible) {
      this.loaded = true;

      // init draggable
      this.initDraggableInstance();
      // initial form state
      this.initFormState();
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

  private initFormState = () => {
    // reset form state
    this.formState = {};
    const { sections } = this.data;
    Object.keys(sections).forEach((key) => {
      const { initialValue } = sections[key];
      this.formState[key] = {
        value: initialValue || null
      };
    });

    // update save button state
    // with initial form state values
    this.updateSaveButtonState();
  }

  private initChangedListener = () => {
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
    const { sections, validation } = this.data;
    const sectionErrors: boolean[] = [];
    const requiredErrors: boolean[] = [];
    Object.keys(sections).forEach((key, index) => {
      // check for errors
      const currentSectionErrors = this.formState[key]?.errors;
      sectionErrors[index] = !!(Array.isArray(currentSectionErrors) && currentSectionErrors.length);

      // check required
      const sectionValue = this.formState[key]?.value;
      requiredErrors[index] = !!(sections[key].required && isEmpty(sectionValue));
    });

    const hasSectionErrors = !!sectionErrors.find((value) => !!value);
    const hasRequiredErrors = !!requiredErrors.find((value) => !!value);
    let disabled = false;
    if (hasSectionErrors) {
      disabled = true;
    } else if (hasRequiredErrors) {
      const numOfErrors = requiredErrors.filter((value) => !!value).length;
      const isOrCondition = validation?.required.condition === 'OR';
      disabled = !!(isOrCondition ? numOfErrors === (requiredErrors.length - 1) : numOfErrors);
    }
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
