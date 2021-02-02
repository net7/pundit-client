import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import ResizeObserver from 'resize-observer-polyfill';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { LayoutEvent } from 'src/app/types';
import { NotebookData, NotebookService, NotebookUpdate } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import {
  AnnotationAttributes, CommentAnnotation, SharingModeType
} from '@pundit/communication';
import { PunditLoginService } from '@pundit/login';
import { SidebarLayoutDS } from './sidebar-layout.ds';
import * as notebook from '../../models/notebook';
import * as annotation from '../../models/annotation';

export class SidebarLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private annotationService: AnnotationService;

  private notebookService: NotebookService;

  private anchorService: AnchorService;

  private userService: UserService;

  private loginService: PunditLoginService;

  private detectorRef: ChangeDetectorRef;

  public dataSource: SidebarLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.init':
          this.annotationService = payload.annotationService;
          this.notebookService = payload.notebookService;
          this.anchorService = payload.anchorService;
          this.layoutEvent$ = payload.layoutEvent$;
          this.detectorRef = payload.detectorRef;
          this.userService = payload.userService;
          this.loginService = payload.loginService;

          this.dataSource.onInit(payload);
          this.listenLayoutEvents();
          this.listenDocumentResize();
          this.listenIsCollapse();
          break;
        case 'sidebar-layout.destroy':
          this.destroy$.next();
          break;
        case 'sidebar-layout.clicklogo': {
          // invert the state of the sidebar
          const state = this.dataSource.isCollapsed.value;
          this.dataSource.isCollapsed.next(!state);
        } break;
        case 'sidebar-layout.notebookpanel': {
          const state = this.dataSource.notebookEditor.getValue();
          this.dataSource.notebookEditor.next(!state);
        } break;
        case 'sidebar-layout.sidebarclose':
          // Close the sidebar
          this.dataSource.isCollapsed.next(true);
          break;
        case 'sidebar-layout.clickusername':
          console.warn('FIXME: gestire username click');
          break;
        case 'sidebar-layout.clicklogout':
          this.layoutEvent$.next({
            type: 'logout'
          });
          break;
        case 'sidebar-layout.requestlogin':
          this.loginService.start();
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.delete':
          this.layoutEvent$.next({ type: 'annotationdelete', payload });
          break;
        case 'annotation.updatenotebook':
          this.handleAnnotationUpdate(payload.annotation, payload.notebook);
          this.layoutEvent$.next({ type: 'annotationupdatenotebook', payload });
          break;
        case 'annotation.togglecollapse':
          this.dataSource.updateAnnotations();
          break;
        case 'annotation.mouseenter':
          this.layoutEvent$.next({
            type: 'annotationmouseenter',
            payload
          });
          break;
        case 'annotation.mouseleave':
          this.layoutEvent$.next({
            type: 'annotationmouseleave',
            payload
          });
          break;
        case 'notebook-panel.editsharingmode': {
          const {
            id, label, sharingMode, type: newSharingMode
          } = payload;
          this.handleNotebookUpdate({ id, label, sharingMode }, { sharingMode: newSharingMode });
        } break;
        default:
          break;
      }
    });
  }

  private listenLayoutEvents() {
    this.layoutEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case 'searchresponse':
          this.dataSource.updateAnnotations(true);
          break;
        case 'annotationdeletesuccess':
          this.annotationService.remove(payload);
          this.dataSource.updateAnnotations(true);
          break;
        case 'annotationcreatesuccess': {
          this.annotationService.add(payload);
          this.dataSource.updateAnnotations(true);
          break;
        }
        case 'anchormouseover':
          this.emitOuter('anchormouseover', payload);
          break;
        case 'anchormouseleave':
          this.emitOuter('anchormouseleave', payload);
          break;
        case 'anchorclick':
          this.emitOuter('anchorclick', payload);
          this.dataSource.isCollapsed.next(false);
          this.dataSource.updateAnnotations();
          break;
        case 'clear':
          this.dataSource.updateAnnotations(true);
          break;
        default:
          break;
      }
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

  private listenIsCollapse() {
    this.dataSource.isCollapsed
      .pipe(
        withLatestFrom(this.dataSource.notebookEditor)
      )
      .subscribe(([isCollapsed, notebookOpen]) => {
        if (isCollapsed && notebookOpen) {
          this.dataSource.notebookEditor.next(false);
        } else if (!isCollapsed) {
          this.dataSource.updateAnnotations();
        }
      });
  }

  private onResize() {
    const { scrollHeight } = document.body;
    // check orphans
    this.anchorService.checkOrphans();

    this.dataSource.height$.next(`${scrollHeight}px`);
    // fix update sidebar height
    setTimeout(() => {
      this.detectorRef.detectChanges();
      this.dataSource.updateAnnotations();
    });
  }

  private handleNotebookUpdate(nb: NotebookData, update: NotebookUpdate) {
    // update the backend version of the notebook
    const userId = this.userService.whoami().id;
    notebook.update(nb.id, {
      data: {
        userId,
        label: update.label ? update.label : nb.label,
        sharingMode: update.sharingMode ? update.sharingMode : (nb.sharingMode as SharingModeType),
        userWithReadAccess: [],
        userWithWriteAccess: [],
      }
    }).then(() => {
      // update the cached version of the notebook
      this.notebookService.update(nb.id, update);
    });
  }

  private handleAnnotationUpdate(annotationID: string, notebookId: string) {
    // update the annotation on the back end

    const { _raw: rawAnnotation } = this.annotationService.getAnnotationById(annotationID);
    const annotationUpdate = {
      type: rawAnnotation.type,
      notebookId,
      serializedBy: rawAnnotation.serializedBy,
      subject: rawAnnotation.subject,
      userId: rawAnnotation.userId
    } as AnnotationAttributes;
    if (rawAnnotation.type === 'Commenting') {
      (annotationUpdate as CommentAnnotation).content = rawAnnotation.content;
    }
    annotation.update(annotationID, annotationUpdate);

    // update annotation component / collection

    this.emitOuter('annotationupdatenb', {
      annotationID,
      notebook: this.notebookService.getNotebookById(notebookId),
    });
  }
}
