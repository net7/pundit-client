import { _t } from '@n7-frontend/core';
import { CommentAnnotation } from '@pundit/communication';
import { EMPTY } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { AppEvent, TooltipEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutTooltipHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    this.layoutEH.outerEvents$.pipe(
      filter(() => {
        if (!this.layoutDS.isUserLogged()) {
          // set anonymous (before login) selection range
          this.layoutDS.setAnonymousSelectionRange();
          this.layoutDS.punditLoginService.start();
          return false;
        }
        return true;
      })
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case TooltipEvent.Click: {
          if (payload === 'highlight') {
            // toast "working..."
            const workingToast = this.layoutDS.toastService.working();
            this.onTooltipHighlight().pipe(
              catchError((e) => {
                this.layoutEH.handleError(e);

                // toast
                this.layoutDS.toastService.error({
                  title: _t('toast#annotationsave_error_title'),
                  text: _t('toast#annotationsave_error_text'),
                  timer: _c('toastTimer'),
                  onLoad: () => {
                    workingToast.close();
                  }
                });

                return EMPTY;
              })
            ).subscribe((newAnnotation) => {
              // signal
              this.layoutEH.appEvent$.next({
                type: AppEvent.AnnotationCreateSuccess,
                payload: newAnnotation
              });

              // toast
              this.layoutDS.toastService.success({
                title: _t('toast#annotationsave_success_title'),
                text: _t('toast#annotationsave_success_text'),
                timer: _c('toastTimer'),
                onLoad: () => {
                  workingToast.close();
                }
              });
            });
          } else if (payload === 'comment') {
            this.onTooltipComment();
          }
          break;
        }
        // TODO
        default:
          break;
      }
    });
  }

  private onTooltipHighlight() {
    const requestPayload = this.layoutDS.annotationService.getAnnotationRequestPayload('Highlighting');
    return this.layoutDS.saveAnnotation(requestPayload);
  }

  private onTooltipComment() {
    // reset
    this.layoutDS.state.comment = {
      comment: null,
      notebookId: null
    };
    this.layoutDS.state.annotation.pendingPayload = (
      this.layoutDS.annotationService.getAnnotationRequestPayload('Commenting') as CommentAnnotation
    );
    this.addPendingAnnotation();
    const pendingAnnotation = this.layoutDS.annotationService.getAnnotationFromPayload(
      this.layoutDS.pendingAnnotationId,
      this.layoutDS.state.annotation.pendingPayload
    );
    this.layoutDS.openCommentModal({ textQuote: pendingAnnotation.subject.selected.text });
  }

  private addPendingAnnotation() {
    const pendingAnnotation = this.layoutDS.annotationService.getAnnotationFromPayload(
      this.layoutDS.pendingAnnotationId,
      this.layoutDS.state.annotation.pendingPayload
    );
    this.layoutDS.anchorService.add(pendingAnnotation);
  }
}
