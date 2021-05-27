import { _t } from '@n7-frontend/core';
import { AuthToken, LoginResponse, SuccessLoginResponse } from '@pundit/communication';
import { forkJoin, Observable, of } from 'rxjs';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { UserData } from 'src/app/services/user.service';
import { LayoutHandler } from 'src/app/types';
import { setTokenFromStorage } from '../../../../common/helpers';
import { CommonEventType, StorageKey } from '../../../../common/types';
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
      this.identitySync();
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

  private identitySync() {
    const currentUser = this.layoutDS.userService.whoami();
    this.layoutDS.punditLoginService.sso()
      .subscribe((resp: LoginResponse) => {
        if ('user' in resp) {
          const { user, token } = resp as SuccessLoginResponse;
          let source$: Observable<unknown> = of(true);
          if (resp.user.id !== currentUser?.id) {
            // update cached & storage data
            source$ = forkJoin({
              user: this.layoutDS.storageService.set(StorageKey.User, user),
              token: this.layoutDS.storageService.set(StorageKey.Token, token)
            });
          }
          source$.subscribe(() => {
            // check user verify
            this.layoutDS.checkUserVerified(user);
            // check storage state
            this.checkStateFromStorage();
          });
        } else if ('error' in resp && resp.error === 'Unauthorized') {
          forkJoin({
            user: this.layoutDS.storageService.remove(StorageKey.User),
            token: this.layoutDS.storageService.remove(StorageKey.Token)
          }).subscribe(() => {
            // check storage state
            this.checkStateFromStorage();
          });
        }
      });
  }

  private checkStateFromStorage() {
    const token$ = this.layoutDS.storageService.get(StorageKey.Token);
    const user$ = this.layoutDS.storageService.get(StorageKey.User);
    const notebookId$ = this.layoutDS.storageService.get(StorageKey.Notebook);
    const currentUser = this.layoutDS.userService.whoami();
    const currentNotebook = this.layoutDS.notebookService.getSelected();

    forkJoin({
      token: token$,
      user: user$,
      notebookId: notebookId$,
    }).subscribe(({ token, user, notebookId }: {
      token: AuthToken;
      user: UserData;
      notebookId: string;
    }) => {
      // no user from storage check
      if (!user && currentUser) {
        this.layoutEH.appEvent$.next({
          type: AppEvent.Logout,
          payload: {
            skipRequest: true
          }
        });
        return;
      }

      // user from storage check
      if ((user && (user?.id !== currentUser?.id))) {
        // trigger logout
        this.layoutEH.appEvent$.next({
          type: AppEvent.Logout,
          payload: {
            skipRequest: true,
            callback: () => {
              // clear toasts
              this.layoutDS.toastService.clear();
              // set token from storage when user changed
              this.layoutDS.storageService.set(StorageKey.Token, token).subscribe(() => {
                setTokenFromStorage();
                // trigger auto-login
                this.layoutDS.userService.iam(user);
                this.layoutDS.notebookService.setSelected(notebookId);
                this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
              });
            }
          }
        });
        return;
      }

      // selected notebook from storage check
      if (
        (currentNotebook && notebookId)
        && (notebookId !== currentNotebook.id)
      ) {
        this.layoutDS.notebookService.setSelected(notebookId);
        this.layoutEH.appEvent$.next({
          type: AppEvent.SelectedNotebookChanged
        });
      }
    });
  }
}
