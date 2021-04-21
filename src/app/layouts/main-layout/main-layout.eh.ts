import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import {
  Subject, ReplaySubject, EMPTY, of
} from 'rxjs';
import { catchError, delay, switchMap } from 'rxjs/operators';
import { StorageKey } from 'src/app/services/storage-service/storage.types';
import { AppEventData } from 'src/app/types';
import { AppEvent, MainLayoutEvent, } from 'src/app/event-types';
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

          // listen javascript url navigation
          this.listenUrlNavigation();
          break;

        case MainLayoutEvent.Destroy:
          this.destroy$.next();
          break;

        case MainLayoutEvent.GetPublicData:
          this.dataSource.getPublicData().pipe(
            catchError((err) => {
              console.warn('PublicData error:', err);
              return of(null);
            })
          ).subscribe(() => {
            // signal
            this.appEvent$.next({
              type: AppEvent.SearchAnnotationResponse
            });
          });
          break;
        case MainLayoutEvent.GetUserData:
          this.dataSource.getUserNotebooks().pipe(
            switchMap(() => this.dataSource.storageService.get(StorageKey.Notebook)),
            switchMap((defaultNotebookId: string) => {
              // set default notebook
              this.dataSource.setDefaultNotebook(defaultNotebookId);
              // emit signal for updates
              this.appEvent$.next({
                type: AppEvent.SearchNotebookResponse
              });
              // do user annotations request
              return this.dataSource.getUserAnnotations();
            }),
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            }),
          ).subscribe(() => {
            this.appEvent$.next({
              type: AppEvent.SearchAnnotationResponse
            });
          });
          break;
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
    const { status } = error.response;
    switch (status) {
      // Unauthorized
      case 401:
        this.appEvent$.next({ type: AppEvent.Logout });
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
}
