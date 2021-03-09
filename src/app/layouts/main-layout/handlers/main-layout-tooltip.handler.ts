import { _t } from '@n7-frontend/core';
import { AnnotationType, CommentAnnotation } from '@pundit/communication';
import { EMPTY } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { AppEvent, TooltipEvent } from 'src/app/event-types';
import { selectionModel } from 'src/app/models/selection/selection-model';
import * as annotationModel from 'src/app/models/annotation';
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
          this.layoutDS.punditLoginService.start();
          return false;
        }
        return true;
      })
    ).subscribe(({ type, payload }) => {
      switch (type) {
        /**
         * Tooltip Events
         * --------------------------------------------------------------------> */
        case TooltipEvent.Click: {
          if (payload === 'highlight') {
            this.onTooltipHighlight().pipe(
              catchError((e) => {
                this.layoutEH.handleError(e);

                // toast
                this.layoutDS.toastService.error({
                  title: _t('toast#annotationsave_error_title'),
                  text: _t('toast#annotationsave_error_text'),
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
    const requestPayload = this.getAnnotationRequestPayload();
    return this.layoutDS.saveAnnotation(requestPayload);
  }

  private onTooltipComment() {
    // reset
    this.layoutDS.state.comment = {
      comment: null,
      notebookId: null
    };
    this.layoutDS.state.annotation.pendingPayload = (
      this.getAnnotationRequestPayload() as CommentAnnotation
    );
    this.addPendingAnnotation();
    const pendingAnnotation = this.layoutDS.annotationService.getAnnotationFromPayload(
      this.layoutDS.pendingAnnotationId,
      this.layoutDS.state.annotation.pendingPayload
    );
    this.layoutDS.openCommentModal({ textQuote: pendingAnnotation.subject.selected.text });
  }

  private getAnnotationRequestPayload() {
    const range = selectionModel.getCurrentRange();
    const userId = this.layoutDS.userService.whoami().id;
    const selectedNotebookId = this.layoutDS.notebookService.getSelected().id;
    const type: AnnotationType = 'Highlighting';
    const options = {};
    return annotationModel.createRequestPayload({
      userId,
      type,
      options,
      notebookId: selectedNotebookId,
      selection: range,
    });
  }

  private addPendingAnnotation() {
    const pendingAnnotation = this.layoutDS.annotationService.getAnnotationFromPayload(
      this.layoutDS.pendingAnnotationId,
      this.layoutDS.state.annotation.pendingPayload
    );
    this.layoutDS.anchorService.add(pendingAnnotation);
  }
}
