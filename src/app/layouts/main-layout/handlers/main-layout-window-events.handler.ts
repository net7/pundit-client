import { _t } from '@n7-frontend/core';
import { getEventType, MainLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { CommonEventType } from '../../../../common/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutWindowEventsHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) {}

  public listen() {
    window.addEventListener(CommonEventType.RootElementExists, this.rootElExistsHandler, false);

    window.onfocus = () => {
      this.layoutEH.emitInner(getEventType(MainLayoutEvent.IdentitySync));
    };

    // on destroy remove event listeners
    this.layoutEH.destroy$.subscribe(() => {
      window.removeEventListener(CommonEventType.RootElementExists, this.rootElExistsHandler);
    });
  }

  private rootElExistsHandler = () => {
    // toast
    this.layoutDS.toastService.info({
      title: _t('toast#rootelementexists_title'),
      text: _t('toast#rootelementexists_text'),
      autoClose: false
    });
  }
}
