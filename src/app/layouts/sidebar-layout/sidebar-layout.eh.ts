import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject } from 'rxjs';
import { delay, takeUntil, withLatestFrom } from 'rxjs/operators';
import ResizeObserver from 'resize-observer-polyfill';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { AppEventData } from 'src/app/types';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { ToastService } from 'src/app/services/toast.service';
import { AppEvent, SidebarLayoutEvent } from 'src/app/event-types';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { SidebarLayoutDS } from './sidebar-layout.ds';

export class SidebarLayoutEH extends EventHandler {
  public destroy$: Subject<void> = new Subject();

  public appEvent$: ReplaySubject<AppEventData>;

  public annotationService: AnnotationService;

  public notebookService: NotebookService;

  public anchorService: AnchorService;

  public userService: UserService;

  public punditLoginService: PunditLoginService;

  public toastService: ToastService;

  public changeDetectorRef: ChangeDetectorRef;

  public dataSource: SidebarLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case SidebarLayoutEvent.Init:
          this.annotationService = payload.annotationService;
          this.notebookService = payload.notebookService;
          this.anchorService = payload.anchorService;
          this.appEvent$ = payload.appEvent$;
          this.userService = payload.userService;
          this.punditLoginService = payload.punditLoginService;
          this.toastService = payload.toastService;
          this.changeDetectorRef = payload.changeDetectorRef;

          this.dataSource.onInit(payload);
          this.listenDocumentResize();
          this.listenSidebarCollapse();
          break;
        case SidebarLayoutEvent.Destroy:
          this.destroy$.next();
          break;
        case SidebarLayoutEvent.ClickLogo:
          {
            // invert the state of the sidebar
            const state = this.dataSource.isCollapsed.value;
            this.dataSource.isCollapsed.next(!state);
          }
          break;
        case SidebarLayoutEvent.ClickNotebookPanel:
          {
            const state = this.dataSource.notebookEditor.getValue();
            this.dataSource.notebookEditor.next(!state);
          }
          break;
        case SidebarLayoutEvent.Close:
          // Close the sidebar
          this.dataSource.isCollapsed.next(true);
          break;
        case SidebarLayoutEvent.ClickUsername:
          console.warn('FIXME: gestire username click');
          break;
        case SidebarLayoutEvent.ClickLogout:
          this.appEvent$.next({
            type: AppEvent.Logout,
          });
          break;
        case SidebarLayoutEvent.RequestLogin:
        case SidebarLayoutEvent.RequestRegister: {
          const isRegister = type === SidebarLayoutEvent.RequestRegister;
          this.punditLoginService.start(isRegister);
          // clear anonymous (before login) selection range
          // only available with tooltip login click
          this.appEvent$.next({
            type: AppEvent.ClearAnonymousSelectionRange,
          });

          // analytics
          AnalyticsModel.track({
            action: isRegister
              ? AnalyticsAction.RegisterButtonClicked
              : AnalyticsAction.LoginButtonClicked,
            payload: {
              location: 'header',
            },
          });
          break;
        }
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }

      this.detectChanges();
    });

    this.outerEvents$
      .pipe(
        delay(1) // symbolic timeout
      )
      .subscribe(() => {
        this.detectChanges();
      });
  }

  private listenDocumentResize() {
    const bodyEl = document.body;
    const resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    resizeObserver.observe(bodyEl);

    // on destroy clear
    this.destroy$.subscribe(() => {
      resizeObserver.disconnect();
    });

    // init
    this.onResize();
  }

  private listenSidebarCollapse() {
    this.dataSource.isCollapsed
      .pipe(
        withLatestFrom(this.dataSource.notebookEditor),
        takeUntil(this.destroy$)
      )
      .subscribe(([isCollapsed, notebookOpen]) => {
        if (isCollapsed && notebookOpen) {
          this.dataSource.notebookEditor.next(false);
        }
        this.dataSource.updateAnnotations();

        // signal
        this.appEvent$.next({
          type: AppEvent.SidebarCollapse,
          payload: { isCollapsed },
        });
      });
  }

  private onResize() {
    const { scrollHeight } = document.body;
    // check orphans
    this.anchorService.checkOrphans();

    this.dataSource.height$.next(`${scrollHeight}px`);
    // fix update sidebar height
    setTimeout(() => {
      this.detectChanges();
      this.dataSource.updateAnnotations();
    });
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
