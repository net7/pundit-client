import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@net7/core';
import {
  Subject, ReplaySubject, EMPTY, of
} from 'rxjs';
import {
  catchError, delay, switchMap
} from 'rxjs/operators';
import { AppEventData } from 'src/app/types';
import {
  AppEvent, getEventType, MainLayoutEvent,
} from 'src/app/event-types';
import { MainLayoutDS } from './main-layout.ds';

export class MainLayoutEH extends EventHandler {
  public destroy$: Subject<void> = new Subject();

  public appEvent$: ReplaySubject<AppEventData>;

  public dataSource: MainLayoutDS;

  public changeDetectorRef: ChangeDetectorRef;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.Init:
          this.changeDetectorRef = payload.changeDetectorRef;
          this.appEvent$ = payload.appEvent$;
          this.dataSource.onInit(payload);
          this.listenSharedUsersChanges();

          // listen javascript url navigation
          this.listenUrlNavigation();
          break;

        case MainLayoutEvent.Destroy:
          this.destroy$.next();
          break;

        case MainLayoutEvent.GetPublicData:
          this.dataSource.getPublicData().pipe(
            catchError((err) => {
              this.dataSource.state.identitySyncLoading = false;
              console.warn('PublicData error:', err);
              return of(null);
            })
          ).subscribe(() => {
            // signal
            this.dataSource.state.identitySyncLoading = false;
            this.appEvent$.next({
              type: AppEvent.SearchAnnotationResponse
            });
          });
          break;
        case MainLayoutEvent.GetUserData: {
          this.dataSource.getUserNotebooks().pipe(
            switchMap(() => {
              // set default notebook
              this.dataSource.setDefaultNotebook();

              // emit signal for updates
              this.appEvent$.next({
                type: AppEvent.SearchNotebookResponse
              });
              // do user annotations request
              return this.dataSource.getUserAnnotations();
            }),
            switchMap(() => this.dataSource.getUserTags()),
            switchMap(() => this.dataSource.getUserSemanticPredicates()),
            catchError((e) => {
              this.dataSource.state.identitySyncLoading = false;
              this.handleError(e);
              return EMPTY;
            }),
          ).subscribe(() => {
            this.dataSource.state.identitySyncLoading = false;
            this.appEvent$.next({
              type: AppEvent.SearchAnnotationResponse
            });
          });
          break;
        }
        default:
          break;
      }
      this.detectChanges();
    });

    this.outerEvents$.pipe(
      delay(1) // symbolic timeout
    ).subscribe(() => {
      this.detectChanges();
    });
  }

  private listenUrlNavigation() {
    const bodyEl = document.body;
    let currentHref = document.location.href;
    const navigationObserver = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        if (currentHref !== document.location.href) {
          currentHref = document.location.href;
          this.appEvent$.next({ type: AppEvent.Refresh });
        }
      });
    });
    navigationObserver.observe(bodyEl, {
      childList: true,
      subtree: true,
    });

    // on destroy clear
    this.destroy$.subscribe(() => {
      navigationObserver.disconnect();
    });
  }

  public handleError(error) {
    let { status } = error;
    if (error.response) {
      status = error.response.status;
    }
    switch (status) {
      // Unauthorized
      case 403:
      case 401:
        if (!this.dataSource.state.identitySyncLoading) {
          this.dataSource.state.identitySyncLoading = true;
          this.appEvent$.next({
            type: AppEvent.Logout,
            payload: {
              skipRequest: true,
              callback: () => {
                // emit signal
                this.emitInner(getEventType(MainLayoutEvent.GetPublicData));
              }
            }
          });
        }
        break;
      default:
        console.warn('FIXME: error handler', error);
        break;
    }
  }

  /**
   * Forces angular's ChangeDetector to
   * detect changes to the UI.
   */
  public detectChanges() {
    // force-reload change detection
    if (this.changeDetectorRef) {
      this.changeDetectorRef.detectChanges();
    }
  }

  private listenSharedUsersChanges() {
    this.dataSource.notebookService.sharedWithChanged$.subscribe((data) => {
      this.dataSource.usersList = data.users;
      this.dataSource.updateShareModal(data.openModal);
    });
  }
}
