import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@net7/core';
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
import { TagService } from 'src/app/services/tag.service';
import { PdfService } from 'src/app/services/pdf.service';
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

  public tagService: TagService;

  public pdfService: PdfService;

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
          this.tagService = payload.tagService;
          this.pdfService = payload.pdfService;
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
            // check onthologies panel
            const onthologiesEditorState = this.dataSource.onthologiesEditor.getValue();
            if (onthologiesEditorState) {
              this.dataSource.onthologiesEditor.next(false);
            }
            const state = this.dataSource.notebookEditor.getValue();
            this.dataSource.notebookEditor.next(!state);
          }
          break;
        case SidebarLayoutEvent.ClickOnthologiesPanel:
          {
            // check notebook panel
            const notebookEditorState = this.dataSource.notebookEditor.getValue();
            if (notebookEditorState) {
              this.dataSource.notebookEditor.next(false);
            }
            const state = this.dataSource.onthologiesEditor.getValue();
            this.dataSource.onthologiesEditor.next(!state);
          }
          break;
        case SidebarLayoutEvent.ClickPageAnnotationPanel:
          {
            const state = this.annotationService.showPageAnnotations$.getValue();
            this.annotationService.showPageAnnotations$.next(!state);
            this.appEvent$.next({
              type: state ? AppEvent.HidePageAnnotations : AppEvent.ShowPageAnnotations
            });
          }
          break;
        case SidebarLayoutEvent.ClickNewFullPageAnnotation:
          this.dataSource.onFullpageDropdownToggle();
          this.appEvent$.next({
            type: AppEvent.AnnotationNewFullPage,
            payload
          });
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
            type: AppEvent.SidebarLogoutClick,
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
              ? AnalyticsAction.RegisterButtonClick
              : AnalyticsAction.LoginButtonClick,
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
    // update sidebar height
    this.updateSidebarHeight();
    // check orphans
    this.anchorService.checkOrphans();
    setTimeout(() => {
      this.detectChanges();
      this.dataSource.updateAnnotations();
    });
  }

  public updateSidebarHeight() {
    const documentHeight = document.documentElement.scrollHeight;
    let { scrollHeight } = document.body;
    scrollHeight = documentHeight > scrollHeight ? documentHeight : scrollHeight;
    // check if document is pdf
    if (this.pdfService.isActive()) {
      const pdfDocumentContainer = this.pdfService.getDocumentContainer();
      const toolbarHeight = this.pdfService.getViewerToolbarHeight();
      if (pdfDocumentContainer) {
        scrollHeight = pdfDocumentContainer.scrollHeight + toolbarHeight;
      }
    }
    // fix update sidebar height
    this.dataSource.height$.next(`${scrollHeight}px`);
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
