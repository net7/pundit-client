import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject, EMPTY } from 'rxjs';
import {
  catchError, takeUntil, withLatestFrom
} from 'rxjs/operators';
import ResizeObserver from 'resize-observer-polyfill';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { LayoutEvent } from 'src/app/types';
import { NotebookData, NotebookService, NotebookUpdate } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import {
  Annotation,
  AnnotationAttributes, CommentAnnotation, PublicNotebook, SharingModeType
} from '@pundit/communication';
import { PunditLoginService } from '@pundit/login';
import { from } from 'rxjs/internal/observable/from';
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

  private punditLoginService: PunditLoginService;

  private changeDetectorRef: ChangeDetectorRef;

  public dataSource: SidebarLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.init':
          this.annotationService = payload.annotationService;
          this.notebookService = payload.notebookService;
          this.anchorService = payload.anchorService;
          this.layoutEvent$ = payload.layoutEvent$;
          this.userService = payload.userService;
          this.punditLoginService = payload.punditLoginService;
          this.changeDetectorRef = payload.changeDetectorRef;

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
          this.punditLoginService.start();
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }

      this.detectChanges();
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'notebook-panel.changeselected': // change the default notebook
          this.notebookService.setSelected(payload);
          this.dataSource.updateNotebookPanel();
          break;
        case 'annotation.delete': // delete an annotation
          this.layoutEvent$.next({ type: 'annotationdeleteclick', payload });
          break;
        case 'annotation.updatenotebook': // move an annotation to another notebook
          this.updateAnnotationNotebook(payload.annotation, payload.notebook);
          this.layoutEvent$.next({ type: 'annotationupdatenotebook', payload });
          break;
        case 'annotation.togglecollapsed': // collapse an annotation (UI)
        {
          const sidebarIsCollapsed = this.dataSource.isCollapsed.value;
          const { collapsed } = payload;
          if (!collapsed && sidebarIsCollapsed) {
            // Open sidebar
            this.dataSource.isCollapsed.next(false);
          }
          this.dataSource.updateAnnotations();
          break;
        }
        case 'annotation.mouseenter': // highlight the corresponding annotation in the host
          this.layoutEvent$.next({
            type: 'annotationmouseenter',
            payload
          });
          break;
        case 'annotation.mouseleave': // remove the highlight from the corresponding annotation
          this.layoutEvent$.next({
            type: 'annotationmouseleave',
            payload
          });
          break;
        case 'annotation.editcomment': // open the comment modal and let the user edit
          this.layoutEvent$.next({
            type: 'annotationeditcomment',
            payload
          });
          break;
        case 'notebook-panel.editsharingmode': { // change sharing mode for the notebook
          const {
            id,
            label,
            sharingMode,
            userId,
            type: newSharingMode
          } = payload;
          this.handleNotebookUpdate({
            id,
            label,
            sharingMode,
            userId
          }, { sharingMode: newSharingMode });
        } break;
        case 'annotation.createnotebook':
          this.createAnnotationNotebook(payload);
          break;
        case 'notebook-panel.createnotebook': {
          // create default data for the new notebook
          const notebookData: PublicNotebook = {
            label: payload, // assign the chosen name
            sharingMode: 'public',
            userId: this.userService.whoami().id, // authentication
          };
          // create the notebook in the backend first to generate the id
          notebook.create({
            data: notebookData
          }).then((res) => {
            // use the received id to cache the new notebook
            this.notebookService.create({
              id: res.data.id,
              ...notebookData, // use the same data for the cache
              created: new Date(),
              changed: new Date(),
            });
            this.notebookService.setSelected(res.data.id); // select the new notebook
            this.dataSource.updateNotebookPanel();
          }).catch((e) => console.error(e));
        } break;
        default:
          break;
      }

      this.detectChanges();
    });
  }

  private listenLayoutEvents() {
    this.layoutEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case 'searchresponse':
          this.dataSource.updateAnnotations(true);
          this.dataSource.updateNotebookPanel();
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
        case 'commentupdate':
          this.updateAnnotationComment(payload);
          break;
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

  private listenIsCollapse() {
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
        this.layoutEvent$.next({
          type: 'sidebarcollapse',
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

  /**
   * Updates the comment of an annotation
   * or changes it from a 'highlight' type to a 'comment' type.
   * @param rawAnnotation Data for the annotation that must be updated
   */
  private updateAnnotationComment(rawAnnotation: Annotation) {
    if (rawAnnotation.type === 'Commenting') {
      const data: AnnotationAttributes = {
        type: rawAnnotation.type,
        content: rawAnnotation.content,
        notebookId: rawAnnotation.notebookId,
        serializedBy: rawAnnotation.serializedBy,
        subject: rawAnnotation.subject,
        userId: rawAnnotation.userId,
      };
      annotation.update(rawAnnotation.id, data).then(() => {
        this.annotationService.update(rawAnnotation.id, {
          comment: rawAnnotation.content.comment,
          notebookId: rawAnnotation.notebookId,
        });
      });
    }
  }

  /**
   * Moves one annotation from it's parent notebook to another notebook.
   * @param annotationID id of the annotation that must be updated
   * @param notebookId id of the notebook that will host the annotation
   */
  private updateAnnotationNotebook(annotationID: string, notebookId: string) {
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
    setTimeout(() => { // waiting for elastic-search index update
      annotation.update(annotationID, annotationUpdate);
    }, 1100);
    // update annotation component / collection
    this.emitOuter('annotationupdatenb', {
      annotationID,
      notebook: this.notebookService.getNotebookById(notebookId),
    });
  }

  private createAnnotationNotebook(payload: { notebook: string; annotation: string }) {
    // create default data for the new notebook
    const notebookData: PublicNotebook = {
      label: payload.notebook, // assign the chosen name
      sharingMode: 'public',
      userId: this.userService.whoami().id, // authentication
    };
    // create the notebook in the backend first to generate the id
    from(notebook.create({
      data: notebookData
    })).pipe(
      catchError((e) => {
        console.error(e);
        return EMPTY;
      })
    ).subscribe((res) => {
      // use the received id to cache the new notebook
      this.notebookService.create({
        id: res.data.id,
        ...notebookData, // use the same data for the cache
        created: new Date(),
        changed: new Date(),
      });
      this.dataSource.updateNotebookPanel();
      this.updateAnnotationNotebook(payload.annotation, res.data.id);
      this.layoutEvent$.next({ type: 'annotationupdatenotebook', payload });
    });
  }

  /**
   * Forces angular's ChangeDetector to
   * detect changes to the UI.
   */
  private detectChanges() {
    // force-reload change detection
    if (this.changeDetectorRef) {
      this.changeDetectorRef.detectChanges();
    }
  }
}
