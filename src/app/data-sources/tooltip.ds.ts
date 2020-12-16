import { NavData } from '@n7-frontend/components';
import { DataSource, _t } from '@n7-frontend/core';

export class TooltipDS extends DataSource {
  transform(): NavData {
    return {
      items: [{
        text: _t('tooltip#highlight'),
        anchor: {
          payload: 'highlight'
        }
      }, {
        text: _t('tooltip#comment'),
        anchor: {
          payload: 'comment'
        }
      }]
    };
  }
}
