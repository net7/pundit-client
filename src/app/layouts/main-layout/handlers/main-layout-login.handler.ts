import { _t } from '@net7/core';
import { takeUntil } from 'rxjs/operators';
import { getEventType, MainLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutLoginHandler implements LayoutHandler {
  constructor(private layoutDS: MainLayoutDS, private layoutEH: MainLayoutEH) { }

  public listen() {
    this.layoutDS.punditLoginService
      .onAuth()
      .pipe(takeUntil(this.layoutEH.destroy$))
      .subscribe((val) => {
        // clear toasts
        this.layoutDS.toastService.clear();
        if ('error' in val) {
          const { error } = val;
          const errorMsg = error || _t('toast#login_error_text');
          // toast
          this.layoutDS.toastService.error({
            title: _t('toast#login_error_title'),
            text: errorMsg,
            autoClose: false,
            actions: [
              {
                text: _t('toast#login_retry_action'),
                payload: 'retry',
              },
            ],
            onAction: (payload) => {
              if (payload === 'retry') {
                this.layoutDS.punditLoginService.start();
              }
            },
          });
          // close login modal
          this.layoutDS.punditLoginService.stop();
        } else if ('user' in val) {
          // close login modal
          this.layoutDS.punditLoginService.stop();
          // emit identity signal
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.IdentityLogin));
        }

        // trigger change detector
        this.layoutEH.detectChanges();
      });

    this.layoutDS.userService.logged$
      .pipe(takeUntil(this.layoutEH.destroy$))
      .subscribe((isLogged) => {
        this.onUserLogged(isLogged);
      });
  }

  private onUserLogged(isLogged: boolean) {
    this.layoutDS.state.isLogged = isLogged;
  }
}
