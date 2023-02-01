import { DataSource, _t } from '@net7/core';
import { NotebookShareModalData } from '../components/notebook-share-modal/notebook-share-modal';
import { NotebookData } from '../services/notebook.service';

export class NotebookShareModalDS extends DataSource {
  transform(data: NotebookData): NotebookShareModalData {
    return {
      visible: true,
      header: {
        label: _t('notebookshare#modal_title', { label: data.label }),
      },
      body: {
        text: _t('notebookshare#modal_text'),
      },
      actions: [{
        label: _t('notebookshare#modal_cancel'),
        payload: {
          source: 'action-cancel'
        }
      }, {
        label: _t('notebookshare#modal_ok'),
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

  public isVisible = () => this.output?.visible;
}
