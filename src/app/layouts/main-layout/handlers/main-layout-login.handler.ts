import { _t } from '@n7-frontend/core';
import { zip } from 'rxjs';
import {
  delay,
  filter,
  first,
  takeUntil
} from 'rxjs/operators';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { _c } from 'src/app/models/config';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { LayoutHandler } from 'src/app/types';
import { setTokenFromStorage } from '../../../../common/helpers';
import { StorageKey } from '../../../../common/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutLoginHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    // user check on init
    const servicesReady$ = zip(
      this.layoutDS.userService.ready$,
      this.layoutDS.notebookService.ready$,
    );
    servicesReady$.subscribe(() => {
      if (this.layoutDS.userService.whoami()) {
        this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
      } else {
        this.loginAlert();
        this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
      }
    });

    this.layoutDS.punditLoginService.onAuth().pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe((val) => {
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
          actions: [{
            text: _t('toast#login_retry_action'),
            payload: 'retry'
          }],
          onAction: (payload) => {
            if (payload === 'retry') {
              this.layoutDS.punditLoginService.start();
            }
          }
        });
        // close login modal
        this.layoutDS.punditLoginService.stop();
      } else if ('user' in val) {
        this.onAuth(val);
        // login toast
        this.layoutDS.toastService.success({
          title: _t('toast#login_success_title'),
          text: _t('toast#login_success_text'),
        });
        // signal
        setTimeout(() => { // waiting for elastic-search index update
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
        }, _c('indexUpdateDelay'));

        // user verified check
        setTimeout(() => {
          this.layoutDS.checkUserVerified(val.user);
          // trigger change detector
          this.layoutEH.detectChanges();
        });
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
    this.layoutDS.storageService.set(StorageKey.Token, token).subscribe(() => {
      setTokenFromStorage();
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
    });
  }

  private onUserLogged(isLogged: boolean) {
    this.layoutDS.state.isLogged = isLogged;
  }

  private loginAlert() {
    this.layoutDS.hasLoaded$.pipe(
      filter(() => _c('showLoginToast')),
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
