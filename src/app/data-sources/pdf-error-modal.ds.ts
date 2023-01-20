import { DataSource, _t } from '@net7/core';
import { PdfErrorModalData } from '../components/pdf-error-modal/pdf-error-modal';

export class PdfErrorModalDS extends DataSource {
  transform(): PdfErrorModalData {
    return {
      visible: false,
      header: {
        label: _t('pdferrormodal#label'),
      },
      body: {
        text: _t('pdferrormodal#text'),
      },
      actions: [{
        label: _t('pdferrormodal#cancel'),
        payload: {
          source: 'action-cancel'
        }
      }, {
        label: _t('pdferrormodal#ok'),
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
