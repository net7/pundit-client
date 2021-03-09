import { LayoutHandler } from 'src/app/types';
import {
  AnnotationEvent, AppEvent, getEventType, SidebarLayoutEvent
} from 'src/app/event-types';
import { _t } from '@n7-frontend/core';
import { AnnotationAttributes, CommentAnnotation, PublicNotebook } from '@pundit/communication';
import { from, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';
import * as annotation from '../../../models/annotation';
import * as notebook from '../../../models/notebook';

export class SidebarLayoutAnnotationHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case AnnotationEvent.Delete:
          this.handleAnnotationDelete(payload);
          break;

        case AnnotationEvent.UpdateNotebook: // move an annotation to another notebook
          this.updateAnnotationNotebook(payload.annotation, payload.notebook);
          this.layoutEH.appEvent$.next({
            payload,
            type: AppEvent.AnnotationUpdateNotebook,
          });
          break;

        case AnnotationEvent.ToggleCollapsed: // collapse an annotation (UI)
          {
            const sidebarIsCollapsed = this.layoutDS.isCollapsed.value;
            const { collapsed } = payload;
            if (!collapsed && sidebarIsCollapsed) {
            // Open sidebar
              this.layoutDS.isCollapsed.next(false);
            }
            this.layoutDS.updateAnnotations();
          } break;

        case AnnotationEvent.MouseEnter: // highlight the corresponding annotation in the host
          this.layoutEH.appEvent$.next({
            type: AppEvent.AnnotationMouseEnter,
            payload
          });
          break;

        case AnnotationEvent.MouseLeave: // remove the highlight from the corresponding annotation
          this.layoutEH.appEvent$.next({
            type: AppEvent.AnnotationMouseLeave,
            payload
          });
          break;

        case AnnotationEvent.EditComment: // open the comment modal and let the user edit
          this.layoutEH.appEvent$.next({
            type: AppEvent.AnnotationEditComment,
            payload
          });
          break;
        case AnnotationEvent.CreateNotebook:
          this.createAnnotationNotebook(payload);
          break;

        default:
          break;
      }

      this.layoutEH.detectChanges();
    });
  }

  private handleAnnotationDelete(annotationID: string) {
    this.layoutEH.appEvent$.next({
      payload: annotationID,
      type: AppEvent.AnnotationDeleteClick,
    });
  }

  /**
   * Moves one annotation from it's parent notebook to another notebook.
   * @param annotationID id of the annotation that must be updated
   * @param notebookId id of the notebook that will host the annotation
   */
  private updateAnnotationNotebook(annotationID: string, notebookId: string) {
    // update the annotation on the back end
    const { _raw: rawAnnotation } = this.layoutEH.annotationService.getAnnotationById(annotationID);
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
      annotation.update(annotationID, annotationUpdate).then(() => {
        // toast
        this.layoutEH.toastService.success({
          title: _t('toast#notebookchange_success_title'),
          text: _t('toast#notebookchange_success_text'),
        });
      }).catch((err) => {
        // toast
        this.layoutEH.toastService.error({
          title: _t('toast#notebookchange_error_title'),
          text: _t('toast#notebookchange_error_text'),
        });
        console.warn('Update annotation notebook error:', err);
      });
    }, 1100);
    // update annotation component / collection
    this.layoutEH.emitOuter(
      getEventType(SidebarLayoutEvent.AnnotationUpdateNotebook),
      {
        annotationID,
        notebook: this.layoutEH.notebookService.getNotebookById(notebookId),
      }
    );
  }

  /**
   * Create a new notebook from a string
   * and assign the new notebook to the relevant annotation.
   *
   * TODO: Refactor into createNotebookFromString()
   */
  private createAnnotationNotebook(payload: { notebook: string; annotation: string }) {
    // create default data for the new notebook
    const notebookData: PublicNotebook = {
      label: payload.notebook, // assign the chosen name
      sharingMode: 'public',
      userId: this.layoutEH.userService.whoami().id, // authentication
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
      this.layoutEH.notebookService.create({
        id: res.data.id,
        ...notebookData, // use the same data for the cache
        created: new Date(),
        changed: new Date(),
      });
      this.layoutDS.updateNotebookPanel();
      this.updateAnnotationNotebook(payload.annotation, res.data.id);
      this.layoutEH.appEvent$.next({
        type: AppEvent.AnnotationUpdateNotebook,
        payload
      });
    });
  }
}
