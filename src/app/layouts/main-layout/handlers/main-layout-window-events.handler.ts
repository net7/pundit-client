import { _t } from '@n7-frontend/core';
import { LoginResponse, SuccessLoginResponse } from '@pundit/communication';
import { forkJoin } from 'rxjs';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { UserData } from 'src/app/services/user.service';
import { LayoutHandler } from 'src/app/types';
import { setTokenFromStorage } from 'src/common/helpers';
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
          if (resp.user.id !== currentUser?.id) {
            // update cached & storage data
            this.layoutDS.storageService.set(StorageKey.User, user);
            this.layoutDS.storageService.set(StorageKey.Token, token);
          }
          // check user verify
          this.layoutDS.checkUserVerified(user);
        } else if ('error' in resp && resp.error === 'Unauthorized') {
          this.layoutDS.storageService.remove(StorageKey.User);
          this.layoutDS.storageService.remove(StorageKey.Token);
        }
        // check storage state
        this.checkStateFromStorage();
      });
  }

  private checkStateFromStorage() {
    const user$ = this.layoutDS.storageService.get(StorageKey.User);
    const notebookId$ = this.layoutDS.storageService.get(StorageKey.Notebook);
    const currentUser = this.layoutDS.userService.whoami();
    const currentNotebook = this.layoutDS.notebookService.getSelected();

    forkJoin({
      user: user$,
      notebookId: notebookId$,
    }).subscribe(({ user, notebookId }: {
      user: UserData;
      notebookId: string;
    }) => {
      // no user from storage check
      if (!user && currentUser) {
        this.layoutEH.appEvent$.next({
          type: AppEvent.Logout,
          payload: false
        });
        return;
      }

      // user from storage check
      if ((user && (user?.id !== currentUser?.id))) {
        // trigger logout
        this.layoutEH.appEvent$.next({
          type: AppEvent.Logout,
          payload: false
        });
        // clear toasts
        this.layoutDS.toastService.clear();
        // set token from storage when user changed
        setTokenFromStorage();
        // trigger auto-login
        this.layoutDS.userService.iam(user);
        this.layoutDS.notebookService.setSelected(notebookId);
        this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
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
