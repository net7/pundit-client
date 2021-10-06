import { _t } from '@n7-frontend/core';
import {
  Annotation, CommentAnnotation, HighlightAnnotation, LinkAnnotation
} from '@pundit/communication';
import { catchError, takeUntil } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { AppEvent, getEventType, SidebarLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { EMPTY } from 'rxjs';
import { AnnotationCssClass } from 'src/app/services/annotation.service';
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
        case AppEvent.SearchAnnotationResponse:
          this.layoutDS.updateAnnotations(true);
          break;
        case AppEvent.SearchNotebookResponse:
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
        case AppEvent.SelectedNotebookChanged:
        case AppEvent.NotebookCreateSuccess:
          this.layoutDS.updateNotebookPanel();
          break;
        case AppEvent.PdfViewerPageChanged:
          this.layoutEH.anchorService.checkOrphans();
          setTimeout(() => {
            this.layoutDS.updateAnnotations();
            this.layoutEH.detectChanges();
          });
          break;
        case AppEvent.PdfViewerHtmlChanged:
          this.layoutEH.anchorService.refresh();
          setTimeout(() => {
            this.layoutDS.updateAnnotations();
            this.layoutEH.detectChanges();
          });
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
    if (['Commenting', 'Highlighting', 'Linking'].includes(rawAnnotation.type)) {
      // toast "working..."
      const workingToast = this.layoutEH.toastService.working();
      // update loading state
      this.layoutEH.annotationService.updateAnnotationState(rawAnnotation.id, {
        classes: AnnotationCssClass.Edit
      });
      // fix typescript explicit
      // annotation types
      let content;
      if (rawAnnotation.type === 'Commenting') {
        content = rawAnnotation.content;
      } else if (rawAnnotation.type === 'Linking') {
        content = rawAnnotation.content;
      }
      const data: CommentAnnotation | HighlightAnnotation | LinkAnnotation = {
        content,
        type: rawAnnotation.type,
        notebookId: rawAnnotation.notebookId,
        serializedBy: rawAnnotation.serializedBy,
        subject: rawAnnotation.subject,
        userId: rawAnnotation.userId,
        tags: rawAnnotation.tags
      };
      this.layoutEH.annotationService.update(rawAnnotation.id, data).pipe(
        catchError((err) => {
          this.layoutEH.toastService.error({
            title: _t('toast#annotationedit_error_title'),
            text: _t('toast#annotationedit_error_text'),
            timer: _c('toastTimer'),
            onLoad: () => {
              workingToast.close();
            }
          });
          console.error('Updated annotation error:', err);
          return EMPTY;
        })
      ).subscribe(() => {
        // update loading state
        this.layoutEH.annotationService.updateAnnotationState(rawAnnotation.id, {
          classes: AnnotationCssClass.Empty
        });

        // refresh sidedar annotations
        this.layoutDS.updateAnnotations();

        // update tags;
        this.layoutEH.tagService.addMany(rawAnnotation?.tags);

        // annotation changed successfully
        this.layoutEH.toastService.success({
          title: _t('toast#annotationedit_success_title'),
          text: _t('toast#annotationedit_success_text'),
          timer: _c('toastTimer'),
          onLoad: () => {
            workingToast.close();
          }
        });
      });
    }
  }
}
