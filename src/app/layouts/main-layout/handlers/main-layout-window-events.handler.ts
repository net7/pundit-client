import { _t } from '@n7-frontend/core';
import { AuthToken, LoginResponse, SuccessLoginResponse } from '@pundit/login';
import { forkJoin } from 'rxjs';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { StorageKey } from 'src/app/services/storage-service/storage.types';
import { UserData } from 'src/app/services/user.service';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutWindowEventsHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) {}

  public listen() {
    window.addEventListener('rootelementexists', this.rootElExistsHandler, false);

    window.onfocus = () => {
      this.identitySync();
    };

    // on destroy remove event listeners
    this.layoutEH.destroy$.subscribe(() => {
      window.removeEventListener('rootelementexists', this.rootElExistsHandler);
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
    this.layoutDS.punditSsoService.sso({ withCredentials: true })
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
    const token$ = this.layoutDS.storageService.get(StorageKey.Token);
    const notebookId$ = this.layoutDS.storageService.get(StorageKey.Notebook);
    const currentUser = this.layoutDS.userService.whoami();
    const currentNotebook = this.layoutDS.notebookService.getSelected();

    forkJoin({
      user: user$,
      token: token$,
      notebookId: notebookId$,
    }).subscribe(({ user, token, notebookId }: {
      user: UserData;
      token: AuthToken;
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
        // trigger auto-login
        this.layoutDS.tokenService.set(token);
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
