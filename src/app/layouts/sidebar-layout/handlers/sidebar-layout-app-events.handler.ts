import { _t } from '@net7/core';
import {
  Annotation, CommentAnnotation, HighlightAnnotation, LinkAnnotation
} from '@pundit/communication';
import { catchError, debounceTime, takeUntil } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { AppEvent, getEventType, SidebarLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { EMPTY, Subject } from 'rxjs';
import { AnnotationCssClass } from 'src/app/services/annotation.service';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

export class SidebarLayoutAppEventsHandler implements LayoutHandler {
  private pdfViewerChanged$: Subject<void> = new Subject();

  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.appEvent$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe((event) => this.handleAppEvent(event));

    // listen pdf viewer
    this.pdfViewerChanged$.pipe(
      debounceTime(500),
    ).subscribe(() => {
      this.layoutEH.updateSidebarHeight();
      this.layoutEH.anchorService.refresh();
      setTimeout(() => {
        this.layoutDS.updateAnnotations();
        this.layoutEH.detectChanges();
      });
    });
  }

  /**
   * Dispatches an app event to its dedicated handler
   * and triggers change detection afterwards.
   *
   * @param event The app event to handle
   */
  private handleAppEvent({ type, payload }: { type: any; payload?: any }) {
    const handler = this.appEventHandlers[type];
    if (handler) {
      handler(payload);
    }

    this.layoutEH.detectChanges();
  }

  /**
   * Map of app-event types to their handler functions.
   * Each handler performs exactly the same work as the
   * corresponding `switch` case it replaces.
   */
  private get appEventHandlers(): { [type: string]: (payload?: any) => void } {
    return {
      [AppEvent.ShowPageAnnotations]: () => {
        const isPageAnnVisible = (
          this.layoutEH.annotationService.showPageAnnotations$.getValue()
        );
        if (!isPageAnnVisible) {
          this.layoutEH.annotationService.showPageAnnotations$.next(true);
        }
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.HidePageAnnotations]: () => {
        const isPageAnnVisible = (
          this.layoutEH.annotationService.showPageAnnotations$.getValue()
        );
        if (isPageAnnVisible) {
          this.layoutEH.annotationService.showPageAnnotations$.next(false);
        }
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.SearchAnnotationResponse]: () => {
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.SearchNotebookResponse]: () => {
        this.layoutDS.updateNotebookPanel();
      },
      [AppEvent.AnnotationDeleteSuccess]: () => {
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.AnnotationCreateSuccess]: (payload) => {
        this.layoutEH.annotationService.add(payload);
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.CommentUpdate]: (payload) => {
        this.updateAnnotationComment(payload);
      },
      [AppEvent.AnchorMouseOver]: (payload) => {
        this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorMouseOver), payload);
      },
      [AppEvent.AnchorMouseLeave]: (payload) => {
        this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorMouseLeave), payload);
      },
      [AppEvent.AnchorClick]: (payload) => {
        this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.AnchorClick), payload);
        this.layoutEH.appEvent$.next({ type: AppEvent.HidePageAnnotations });
        this.layoutDS.isCollapsed.next(false);
        this.layoutDS.updateAnnotations();
      },
      [AppEvent.Clear]: () => {
        this.layoutDS.updateAnnotations(true);
      },
      [AppEvent.SelectedNotebookChanged]: () => {
        this.layoutDS.updateNotebookPanel();
      },
      [AppEvent.NotebookCreateSuccess]: () => {
        this.layoutDS.updateNotebookPanel();
      },
      [AppEvent.PdfViewerPageChanged]: () => {
        this.pdfViewerChanged$.next();
      },
      [AppEvent.PdfViewerHtmlChanged]: () => {
        this.pdfViewerChanged$.next();
      },
      [AppEvent.PdfViewerLoaded]: () => {
        this.pdfViewerChanged$.next();
      }
    };
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
      let content: any;
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
        this.layoutEH.tagService.addMany(rawAnnotation?.tags || []);

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
