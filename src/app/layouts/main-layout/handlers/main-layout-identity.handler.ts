import { _t } from '@n7-frontend/core';
import { LoginResponse, SuccessLoginResponse } from '@pundit/communication';
import { delay, filter, first } from 'rxjs/operators';
import {
  AppEvent, getEventType, MainLayoutEvent
} from 'src/app/event-types';
import { _c } from 'src/app/models/config';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { LayoutHandler } from 'src/app/types';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutIdentityHandler implements LayoutHandler {
  constructor(private layoutDS: MainLayoutDS, private layoutEH: MainLayoutEH) { }

  public listen() {
    // init
    this.doInitRequest();

    this.layoutEH.innerEvents$.subscribe(({ type }) => {
      switch (type) {
        case MainLayoutEvent.IdentityLogin:
          this.doLoginRequest();
          break;
        case MainLayoutEvent.IdentitySync:
          this.doSyncRequest();
          break;
        default:
          break;
      }
    });
  }

  private doInitRequest() {
    this.layoutDS.punditLoginService.sso()
      .subscribe((resp: LoginResponse) => {
        if ('user' in resp) {
          const { user } = resp;
          // set user
          this.layoutDS.userService.iam(user);
          // set notifications
          this.layoutDS.userService.dashboardNotifications$.next(user?.notifications?.total || 0);
          // set default notebook
          this.layoutDS.notebookService.setSelected(user.current_notebook);
          // emit signal
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
          // check user verify
          this.layoutDS.checkUserVerified(user);
        } else if ('error' in resp && resp.error === 'Unauthorized') {
          this.loginAlert();
          // emit signal
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
        }
      });
  }

  private doLoginRequest() {
    this.layoutDS.punditLoginService.sso()
      .subscribe((resp: LoginResponse) => {
        if ('user' in resp) {
          const { user } = resp;
          this.layoutDS.userService.iam({
            ...user,
            id: `${user.id}`,
          });
          // set notifications
          this.layoutDS.userService.dashboardNotifications$.next(user?.notifications?.total || 0);

          if (this.layoutDS.state.anonymousSelectionRange) {
            const {
              anonymousSelectionRange: lastSelectionRange,
            } = this.layoutDS.state;
            selectionModel.setSelectionFromRange(lastSelectionRange);
            tooltipModel.show(selectionModel.getCurrentSelection());
          }
          // login toast
          this.layoutDS.toastService.success({
            title: _t('toast#login_success_title'),
            text: _t('toast#login_success_text'),
          });
          this.layoutDS.notebookService.setSelected(user.current_notebook);
          // signal
          setTimeout(() => {
            // waiting for elastic-search index update
            this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
          }, _c('indexUpdateDelay'));

          // user verified check
          setTimeout(() => {
            this.layoutDS.checkUserVerified(user);
            // trigger change detector
            this.layoutEH.detectChanges();
          });
        } else if ('error' in resp && resp.error === 'Unauthorized') {
          // error toast
          console.warn('Identity login response error', resp);
          this.layoutDS.toastService.error({
            title: _t('toast#genericerror_title'),
            text: _t('toast#genericerror_text'),
            autoClose: false
          });
          // emit signal
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
        }
      });
  }

  private doSyncRequest() {
    this.layoutDS.punditLoginService.sso()
      .subscribe((resp: LoginResponse) => {
        const currentUser = this.layoutDS.userService.whoami();
        if ('user' in resp) {
          const { user } = resp as SuccessLoginResponse;
          // same user
          if (currentUser && currentUser.id === user.id) {
            // set notifications
            this.layoutDS.userService.dashboardNotifications$.next(user?.notifications?.total || 0);
            this.layoutDS.notebookService.setSelected(user.current_notebook);
            this.layoutEH.appEvent$.next({
              type: AppEvent.SelectedNotebookChanged
            });
          // other user or no user on client
          } else if (currentUser?.id !== user.id) {
            // trigger logout
            if (!this.layoutDS.state.identitySyncLoading) {
              this.layoutDS.state.identitySyncLoading = true;
              this.layoutEH.appEvent$.next({
                type: AppEvent.Logout,
                payload: {
                  skipRequest: true,
                  callback: () => {
                  // clear toasts
                    this.layoutDS.toastService.clear();
                    // trigger auto-login
                    this.layoutDS.userService.iam(user);
                    // set notifications
                    this.layoutDS.userService.dashboardNotifications$
                      .next(user?.notifications?.total || 0);
                    // set default notebook
                    this.layoutDS.notebookService.setSelected(user.current_notebook);
                    // emit signal
                    this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
                  }
                }
              });
            }
          }

          // check user verify
          this.layoutDS.checkUserVerified(user);
        } else if ('error' in resp && resp.error === 'Unauthorized') {
          // check user on client
          if (currentUser) {
            this.layoutEH.appEvent$.next({
              type: AppEvent.Logout,
              payload: {
                skipRequest: true,
                callback: () => {
                  // emit signal
                  this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
                }
              }
            });
          }
        }
      });
  }

  private loginAlert() {
    this.layoutDS.hasLoaded$
      .pipe(
        filter(() => _c('showLoginToast')),
        first(),
        delay(1000) // fix render
      )
      .subscribe(() => {
        const loginAlertToast = this.layoutDS.toastService.warn({
          title: _t('toast#login_warn_title'),
          text: _t('toast#login_warn_text'),
          actions: [
            {
              text: _t('toast#login_warn_action'),
              payload: 'login',
            },
            {
              text: _t('toast#register_warn_action'),
              payload: 'register',
            },
          ],
          autoClose: false,
          onAction: (payload) => {
            if (['login', 'register'].includes(payload)) {
              const isRegister = payload === 'register';
              this.layoutDS.punditLoginService.start(isRegister);
              // clear anonymous selection range
              // only available with tooltip login click
              this.layoutEH.appEvent$.next({
                type: AppEvent.ClearAnonymousSelectionRange,
              });

              // analytics
              AnalyticsModel.track({
                action: isRegister
                  ? AnalyticsAction.RegisterButtonClick
                  : AnalyticsAction.LoginButtonClick,
                payload: {
                  location: 'toast',
                },
              });
            }
          },
        });

        // on auth close login alert
        this.layoutDS.punditLoginService
          .onAuth()
          .pipe(first())
          .subscribe(() => {
            loginAlertToast.close();

            // trigger change detector
            this.layoutEH.detectChanges();
          });
      });
  }
}
