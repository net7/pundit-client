import { DataSource, _t } from '@n7-frontend/core';
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
    } = data;

    const formSections: {
      [id: string]: FormSectionData<unknown, unknown>;
    } = {};

    sections.forEach(({
      id, value, options, required
    }) => {
      formSections[id] = {
        changed$: new Subject(),
        initialValue: value || null,
        options: options || {},
        required: !!required
      };
    });

    return {
      textQuote,
      visible: true,
      header: {
        label: _t('commentmodal#label'),
      },
      sections: formSections,
      actions: [{
        label: _t('commentmodal#cancel'),
        payload: {
          source: 'action-cancel'
        }
      }, {
        label: saveButtonLabel || _t('commentmodal#save'),
        classes: 'pnd-btn-cta',
        disabled: true,
        payload: {
          source: 'action-save'
        }
      }],
      _setDraggableInstance: (instance) => {
        this.draggableInstance = instance;
        const { x, y } = this.draggableInstance.get();
        this.defaultPosition = { x, y };
      },
    };
  }

  public isVisible = () => this.output?.visible;

  public close() {
    this.output.visible = false;
    const { x, y } = this.defaultPosition;
    this.draggableInstance.set(x, y);
  }
}
