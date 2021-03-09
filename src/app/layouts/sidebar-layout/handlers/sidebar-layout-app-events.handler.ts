import { _t } from '@n7-frontend/core';
import { Annotation, AnnotationAttributes } from '@pundit/communication';
import { takeUntil } from 'rxjs/operators';
import { AppEvent, getEventType, SidebarLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';
import * as annotation from '../../../models/annotation';

export class SidebarLayoutAppEventsHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.appEvent$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case AppEvent.SearchResponse:
          this.layoutDS.updateAnnotations(true);
          this.layoutDS.updateNotebookPanel();
          break;
        case AppEvent.AnnotationDeleteSuccess:
          this.layoutEH.annotationService.remove(payload);
          this.layoutDS.updateAnnotations(true);
          break;
        case AppEvent.AnnotationCreateSuccess: {
          this.layoutEH.annotationService.add(payload);
          this.layoutDS.updateAnnotations(true);
          break;
        }
        case AppEvent.CommentUpdate:
          this.updateAnnotationComment(payload);
          break;
        case AppEvent.AnchorMouseOver:
          this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorMouseOver), payload);
          break;
        case AppEvent.AnchorMouseLeave:
          this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorMouseLeave), payload);
          break;
        case AppEvent.AnchorClick:
          this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorClick), payload);
          this.layoutDS.isCollapsed.next(false);
          this.layoutDS.updateAnnotations();
          break;
        case AppEvent.Clear:
          this.layoutDS.updateAnnotations(true);
          break;
        default:
          break;
      }

      this.layoutEH.detectChanges();
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
        this.layoutEH.annotationService.update(rawAnnotation.id, {
          comment: rawAnnotation.content.comment,
          notebookId: rawAnnotation.notebookId,
        });
      }).then(() => {
        // toast
        this.layoutEH.toastService.success({
          title: _t('toast#annotationedit_success_title'),
          text: _t('toast#annotationedit_success_text'),
        });
      }).catch((err) => {
        // toast
        this.layoutEH.toastService.error({
          title: _t('toast#annotationedit_error_title'),
          text: _t('toast#annotationedit_error_text'),
        });
        console.warn('Updated annotation error:', err);
      });
    }
  }
}
