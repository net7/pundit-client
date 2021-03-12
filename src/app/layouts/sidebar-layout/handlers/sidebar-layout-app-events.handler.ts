import { _t } from '@n7-frontend/core';
import { Annotation, CommentAnnotation } from '@pundit/communication';
import { catchError, takeUntil } from 'rxjs/operators';
import { AppEvent, getEventType, SidebarLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { EMPTY } from 'rxjs';
import { AnnotationCssClass } from 'src/app/data-sources';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

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
   *
   * @param rawAnnotation Data for the annotation that must be updated
   */
  private updateAnnotationComment(rawAnnotation: Annotation) {
    if (rawAnnotation.type === 'Commenting') {
      // show toast update annotation "loading..."
      const toastLoading = this.layoutEH.toastService.info({
        title: _t('toast#annotationedit_loading_title'),
        text: _t('toast#annotationedit_loading_text'),
        autoClose: false
      });
      // update loading state
      this.layoutEH.annotationService.updateLoadingState(rawAnnotation.id, {
        cssClass: AnnotationCssClass.Edit
      });
      const data: CommentAnnotation = {
        type: rawAnnotation.type,
        content: rawAnnotation.content,
        notebookId: rawAnnotation.notebookId,
        serializedBy: rawAnnotation.serializedBy,
        subject: rawAnnotation.subject,
        userId: rawAnnotation.userId,
      };
      this.layoutEH.annotationService.update(rawAnnotation.id, data).pipe(
        catchError((err) => {
          // close toast update annotation "loading..."
          toastLoading.close();

          this.layoutEH.toastService.error({
            title: _t('toast#annotationedit_error_title'),
            text: _t('toast#annotationedit_error_text'),
          });
          console.error('Updated annotation error:', err);
          return EMPTY;
        })
      ).subscribe(() => {
        // close toast update annotation "loading..."
        toastLoading.close();

        // update loading state
        this.layoutEH.annotationService.updateLoadingState(rawAnnotation.id, {
          cssClass: AnnotationCssClass.Empty
        });

        // refresh sidedar annotations
        this.layoutDS.updateAnnotations();

        // annotation changed successfully
        this.layoutEH.toastService.success({
          title: _t('toast#annotationedit_success_title'),
          text: _t('toast#annotationedit_success_text'),
        });
      });
    }
  }
}
