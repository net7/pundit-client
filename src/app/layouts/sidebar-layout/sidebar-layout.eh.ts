import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject } from 'rxjs';
import {
  takeUntil, withLatestFrom
} from 'rxjs/operators';
import ResizeObserver from 'resize-observer-polyfill';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { AppEventData } from 'src/app/types';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { PunditLoginService } from '@pundit/login';
import { ToastService } from 'src/app/services/toast.service';
import {
  AppEvent, SidebarLayoutEvent
} from 'src/app/events';
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
        case SidebarLayoutEvent.ClickLogo: {
          // invert the state of the sidebar
          const state = this.dataSource.isCollapsed.value;
          this.dataSource.isCollapsed.next(!state);
        } break;
        case SidebarLayoutEvent.ClickNotebookPanel: {
          const state = this.dataSource.notebookEditor.getValue();
          this.dataSource.notebookEditor.next(!state);
        } break;
        case SidebarLayoutEvent.Close:
          // Close the sidebar
          this.dataSource.isCollapsed.next(true);
          break;
        case SidebarLayoutEvent.ClickUsername:
          console.warn('FIXME: gestire username click');
          break;
        case SidebarLayoutEvent.ClickLogout:
          this.appEvent$.next({
            type: AppEvent.Logout
          });
          break;
        case SidebarLayoutEvent.RequestLogin:
          this.punditLoginService.start();
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }

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
          payload: { isCollapsed }
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
