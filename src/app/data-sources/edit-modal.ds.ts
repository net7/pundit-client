import { DataSource, _t } from '@net7/core';
import { uniqueId } from 'lodash';
import { Subject } from 'rxjs';
import { EditModalData } from '../components/edit-modal/edit-modal';
import { EditModalParams, FormSectionData } from '../types';

export class EditModalDS extends DataSource {
  private draggableInstance;

  private defaultPosition: { x: number; y: number };

  transform(data: EditModalParams): EditModalData {
    const {
      textQuote,
      saveButtonLabel,
      sections,
      validation
    } = data;

    const formSections: {
      [id: string]: FormSectionData<unknown, unknown>;
    } = {};

    sections.forEach(({
      id, value, options, required, focus
    }) => {
      formSections[id] = {
        changed$: new Subject(),
        initialValue: value || null,
        options: options || {},
        required: !!required,
        focus: !!focus
      };
    });

    return {
      textQuote,
      visible: true,
      header: {
        label: _t('editmodal#label'),
      },
      sections: formSections,
      actions: {
        cancel: {
          label: _t('editmodal#cancel')
        },
        save: {
          label: saveButtonLabel || _t('editmodal#save'),
          classes: 'pnd-btn-cta',
          disabled: true,
        }
      },
      _internalId: uniqueId(),
      _setDraggableInstance: (instance) => {
        this.draggableInstance = instance;
        const { x, y } = this.draggableInstance.get();
        this.defaultPosition = { x, y };
      },
      validation
    };
  }

  public isVisible = () => this.output?.visible;

  public close() {
    this.output.visible = false;
    const { x, y } = this.defaultPosition;
    this.draggableInstance.set(x, y);
  }

  public changeActionsVisibility(hide: boolean) {
    this.output.hideActions = hide;
  }
}
