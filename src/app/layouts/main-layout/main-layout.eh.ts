import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import {
  Subject, ReplaySubject, EMPTY, of
} from 'rxjs';
import { catchError } from 'rxjs/operators';
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
              type: AppEvent.SearchResponse
            });
          });
          break;
        case MainLayoutEvent.GetUserData:
          this.dataSource.getUserData().pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            }),
          ).subscribe(() => {
            this.appEvent$.next({
              type: AppEvent.SearchResponse
            });
          });
          break;
        default:
          break;
      }

      this.detectChanges();
    });

    this.outerEvents$.subscribe(() => {
      this.detectChanges();
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
        // TODO
        break;
    }
    console.warn('FIXME: error handler', error);
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
