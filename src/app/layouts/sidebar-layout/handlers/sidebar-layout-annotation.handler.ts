import { LayoutHandler } from 'src/app/types';
import {
  AnnotationEvent, AppEvent, getEventType, SidebarLayoutEvent
} from 'src/app/event-types';
import { _t } from '@n7-frontend/core';
import {
  AnnotationAttributes, CommentAnnotation, SharingModeType
} from '@pundit/communication';
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
    const { data: rawAnnotation } = this.layoutEH.annotationService.getAnnotationById(annotationID);
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
    // update annotation component
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
   * @param payload - Data to create and assign the notebook
   */
  private createAnnotationNotebook(payload: {
    /** Label of the new notebook */
    label: string;
    /** ID of the annotation that created the notebook */
    annotationID: string;
  }) {
    // create the notebook in the backend first to generate it's id
    this.createNotebookFromString(payload.label)
      .then((res) => {
        this.cacheNewNotebook({
          id: res.data.id,
          label: payload.label,
        });
        this.layoutDS.updateNotebookPanel();
        this.updateAnnotationNotebook(payload.annotationID, res.data.id);
        this.layoutEH.appEvent$.next({
          type: AppEvent.AnnotationUpdateNotebook,
          payload
        });
      })
      .catch((err) => console.error(err));
  }

  /**
   * Create a notebook in the backend from a label
   * @param name label for the new notebook
   */
  private createNotebookFromString(name: string) {
    const userId = this.layoutEH.userService.whoami().id;
    return notebook.create({
      data: {
        label: name,
        sharingMode: 'public',
        userId
      }
    });
  }

  /**
   * Add a notebook to the local cache.
   * @param notebookData data for the new notebook to be cached, only id and label required.
   */
  private cacheNewNotebook(notebookData: {
    id: string;
    label: string;
    userId?: string;
    sharingMode?: SharingModeType;
  }) {
    const { id, label, userId } = notebookData;
    this.layoutEH.notebookService.create({
      id,
      label,
      userId: userId || this.layoutEH.userService.whoami().id,
      sharingMode: 'public', // when a notebook is created it defaults to public
      created: new Date(),
      changed: new Date()
    });
  }
}
