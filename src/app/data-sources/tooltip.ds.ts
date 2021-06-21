import { DataSource, _t } from '@n7-frontend/core';
import { TooltipData } from '../components/tooltip/tooltip';

export class TooltipDS extends DataSource {
  transform(): TooltipData {
    return {
      visible: false,
      navData: {
        items: [{
          text: _t('tooltip#highlight'),
          anchor: {
            payload: 'highlight'
          }
        },
        {
          text: _t('tooltip#tag'),
          anchor: {
            payload: 'tag'
          }
        },
        {
          text: _t('tooltip#comment'),
          anchor: {
            payload: 'comment'
          }
        }
        ]
      }
    };
  }

  setVisible(visible: boolean) {
    this.output.visible = visible;
  }
}
