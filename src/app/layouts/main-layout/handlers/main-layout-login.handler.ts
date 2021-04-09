import { _t } from '@n7-frontend/core';
import { delay, first, takeUntil } from 'rxjs/operators';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutLoginHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    // user check on init
    if (this.layoutDS.userService.whoami()) {
      this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
    } else {
      this.loginAlert();
      this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
    }

    this.layoutDS.punditLoginService.onAuth().pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe((val) => {
      if ('error' in val) {
        const { error } = val;
        const errorObj = JSON.parse(error);
        const errorMsg = errorObj?.error?.error || _t('toast#login_error_text');
        console.warn('Auth error', errorObj);
        // toast
        this.layoutDS.toastService.error({
          title: _t('toast#login_error_title'),
          text: errorMsg,
          autoClose: false
        });
        // close login modal
        this.layoutDS.punditLoginService.stop();
      } else if ('user' in val) {
        this.onAuth(val);
        // toast
        this.layoutDS.toastService.success({
          title: _t('toast#login_success_title'),
          text: _t('toast#login_success_text'),
        });
        // signal
        this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
      }

      // trigger change detector
      this.layoutEH.detectChanges();
    });

    this.layoutDS.userService.logged$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe((isLogged) => {
      this.onUserLogged(isLogged);
    });
  }

  private onAuth({ token, user }) {
    // set token
    this.layoutDS.tokenService.set(token.access_token);
    // set user
    this.layoutDS.userService.iam({
      ...user,
      id: `${user.id}`
    });
    // close login modal
    this.layoutDS.punditLoginService.stop();
    // if there is an anonymous (before login) selection
    // triggers selection manually
    if (this.layoutDS.state.anonymousSelectionRange) {
      const { anonymousSelectionRange: lastSelectionRange } = this.layoutDS.state;
      selectionModel.setSelectionFromRange(lastSelectionRange);
      tooltipModel.show(selectionModel.getCurrentSelection());
    }
  }

  private onUserLogged(isLogged: boolean) {
    this.layoutDS.state.isLogged = isLogged;
  }

  private loginAlert() {
    this.layoutDS.hasLoaded$.pipe(
      first(),
      delay(1000) // fix render
    ).subscribe(() => {
      const loginAlertToast = this.layoutDS.toastService.warn({
        title: _t('toast#login_warn_title'),
        text: _t('toast#login_warn_text'),
        actions: [{
          text: _t('toast#login_warn_action'),
          payload: 'login'
        }],
        autoClose: false,
        onAction: (payload) => {
          if (payload === 'login') {
            this.layoutDS.punditLoginService.start();
            // clear anonymous selection range
            // only available with tooltip login click
            this.layoutEH.appEvent$.next({
              type: AppEvent.ClearAnonymousSelectionRange
            });
          }
        }
      });

      // on auth close login alert
      this.layoutDS.punditLoginService.onAuth().pipe(
        first()
      ).subscribe(() => {
        loginAlertToast.close();

        // trigger change detector
        this.layoutEH.detectChanges();
      });
    });
  }
}
