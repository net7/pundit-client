import { DataSource, _t } from '@n7-frontend/core';
import { DeleteModalData } from '../components/delete-modal/delete-modal';

export class DeleteModalDS extends DataSource {
  transform(): DeleteModalData {
    return {
      visible: false,
      header: {
        label: _t('deletemodal#label'),
      },
      body: {
        text: _t('deletemodal#text'),
      },
      actions: [{
        label: _t('deletemodal#cancel'),
        payload: {
          source: 'action-cancel'
        }
      }, {
        label: _t('deletemodal#ok'),
        classes: 'pnd-btn-cta',
        payload: {
          source: 'action-ok'
        }
      }]
    };
  }

  public close() {
    this.output.visible = false;
  }

  public open() {
    this.output.visible = true;
  }
}
