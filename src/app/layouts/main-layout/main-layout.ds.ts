import { LayoutDataSource, _t } from '@n7-frontend/core';
import { _c } from 'src/app/models/config';

export class MainLayoutDS extends LayoutDataSource {
  public titleData = {
    title: {
      main: {
        text: _t('hello'),
        classes: 'bold',
      },
      secondary: {
        text: _c('name'),
        classes: 'italic',
      }
    },
  }

  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  onInit(payload) {}
}
