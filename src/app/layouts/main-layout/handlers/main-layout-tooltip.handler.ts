import { _t } from '@n7-frontend/core';
import { HighlightAnnotation } from '@pundit/communication';
import { EMPTY } from 'rxjs';
import { catchError, filter, withLatestFrom } from 'rxjs/operators';
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
    this.layoutEH.outerEvents$.pipe(withLatestFrom(this.layoutDS.hasLoaded$),
      filter(([, loaded]) => {
        if (!this.layoutDS.isUserLogged()) {
          // set anonymous (before login) selection range
          this.layoutDS.setAnonymousSelectionRange();
          this.layoutDS.punditLoginService.start();
          return false;
        }
        if (!loaded) {
          this.layoutDS.toastService.warn({ title: _t('toast#loadingdata_title'), text: _t('toast#loadingdata_text'), autoClose: true, });
          return false;
        }
        return true;
      })).subscribe(([{ type, payload }]) => {
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
          } else if (payload === 'tag') {
            this.onTooltipTag();
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
    const requestPayload = this.layoutDS.annotationService.getAnnotationRequestPayload();
    return this.layoutDS.saveAnnotation(requestPayload);
  }

  private onTooltipComment() {
    this.setInnerStateForNewComment();
    this.layoutDS.state.annotation.pendingPayload = (
      this.layoutDS.annotationService.getAnnotationRequestPayload() as HighlightAnnotation
    );
    const pendingAnnotation = this.addPendingAnnotation();

    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.selected.text,
      comment: { visible: true }
    });
  }

  private onTooltipTag() {
    this.setInnerStateForNewTags();
    this.layoutDS.state.annotation.pendingPayload = (
      this.layoutDS.annotationService.getAnnotationRequestPayload() as HighlightAnnotation
    );
    const pendingAnnotation = this.addPendingAnnotation();
    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.selected.text,
      tags: { visible: true, values: this.layoutDS.state.editModal.tags }
    });
  }

  private setInnerStateForNewComment() {
    const { isOpen, isUpdate } = this.layoutDS.state.editModal;
    if ((isOpen && isUpdate) || !isOpen) {
      this.layoutDS.state.editModal = {
        comment: null,
        notebookId: null,
        isOpen: true,
        tags: null
      };
    } else if (isOpen && !isUpdate) {
      this.layoutDS.state.editModal.tags = null;
    }
  }

  private setInnerStateForNewTags() {
    const { isOpen, isUpdate } = this.layoutDS.state.editModal;
    if ((isOpen && isUpdate) || !isOpen) {
      this.layoutDS.state.editModal = {
        comment: null,
        notebookId: null,
        isOpen: true,
        tags: null
      };
    } else if (isOpen && !isUpdate) {
      this.layoutDS.state.editModal.comment = null;
    }
  }

  private addPendingAnnotation() {
    const pendingAnnotation = this.layoutDS.annotationService.getAnnotationFromPayload(
      this.layoutDS.pendingAnnotationId,
      this.layoutDS.state.annotation.pendingPayload
    );
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.anchorService.add(pendingAnnotation);

    return pendingAnnotation;
  }
}
