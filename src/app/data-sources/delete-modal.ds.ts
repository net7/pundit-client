import { DataSource, _t } from '@net7/core';
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
    this.setOutput({ visible: false });
  }

  public open() {
    this.setOutput({ visible: true });
  }

  public isVisible = () => this.output?.visible;

  private setOutput(update: Partial<DeleteModalData>) {
    this.output = {
      ...this.output,
      ...update
    };
    this.out$.next(this.output);
  }
}
