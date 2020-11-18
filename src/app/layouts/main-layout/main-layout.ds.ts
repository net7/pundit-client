import { LayoutDataSource, _t } from '@n7-frontend/core';
import { _c } from 'src/app/models/config';

export class MainLayoutDS extends LayoutDataSource {
  public appName = _c('name');

  public helloText = _t('hello');

  // onInit(payload) {
  //   // TODO
  // }
}
