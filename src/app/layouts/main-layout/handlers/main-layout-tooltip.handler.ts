import { _t } from '@n7-frontend/core';
import { EMPTY } from 'rxjs';
import { catchError, filter, withLatestFrom } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import {
  AppEvent, TooltipEvent
} from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutTooltipHandler implements LayoutHandler {
  constructor(private layoutDS: MainLayoutDS, private layoutEH: MainLayoutEH) {}

  public listen() {
    this.layoutEH.outerEvents$
      .pipe(
        withLatestFrom(this.layoutDS.hasLoaded$),
        filter(([, loaded]) => {
          if (!this.layoutDS.isUserLogged()) {
            // set anonymous (before login) selection range
            this.layoutDS.setAnonymousSelectionRange();
            this.layoutDS.punditLoginService.start();

            // analytics
            AnalyticsModel.track({
              action: AnalyticsAction.LoginButtonClick,
              payload: {
                location: 'annotation-tooltip',
              },
            });

            return false;
          }
          if (!loaded) {
            this.layoutDS.toastService.warn({
              title: _t('toast#loadingdata_title'),
              text: _t('toast#loadingdata_text'),
              autoClose: true,
            });
            return false;
          }
          return true;
        })
      )
      .subscribe(([{ type, payload }]) => {
        switch (type) {
          case TooltipEvent.Click: {
            // reset previous payload
            this.layoutDS.state.annotation.pendingPayload = null;
            this.layoutDS.state.annotation.updatePayload = null;
            this.layoutEH.appEvent$.next({ type: AppEvent.HidePageAnnotations, payload });
            if (payload === 'highlight') {
              // toast "working..."
              const workingToast = this.layoutDS.toastService.working();
              this.onTooltipHighlight()
                .pipe(
                  catchError((e) => {
                    this.layoutEH.handleError(e);

                    // toast
                    this.layoutDS.toastService.error({
                      title: _t('toast#annotationsave_error_title'),
                      text: _t('toast#annotationsave_error_text'),
                      timer: _c('toastTimer'),
                      onLoad: () => {
                        workingToast.close();
                      },
                    });

                    return EMPTY;
                  })
                )
                .subscribe((newAnnotation) => {
                  // signal
                  this.layoutEH.appEvent$.next({
                    type: AppEvent.AnnotationCreateSuccess,
                    payload: newAnnotation,
                  });

                  // toast
                  this.layoutDS.toastService.success({
                    title: _t('toast#annotationsave_success_title'),
                    text: _t('toast#annotationsave_success_text'),
                    timer: _c('toastTimer'),
                    onLoad: () => {
                      workingToast.close();
                    },
                  });

                  // analytics
                  AnalyticsModel.track({
                    action: AnalyticsAction.HighlightAnnotationCreated,
                  });
                });
            } else if (payload === 'comment') {
              this.onTooltipComment();
            } else if (payload === 'tag') {
              this.onTooltipTag();
            } else if (payload === 'semantic') {
              this.onTooltipSemantic();
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
    const pendingAnnotation = this.layoutDS.addPendingAnnotation();

    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.selected.text,
      sections: [{
        id: 'comment',
        required: true,
        focus: true
      }, {
        id: 'tags',
      }, {
        id: 'notebook'
      }]
    });
  }

  private onTooltipTag() {
    const pendingAnnotation = this.layoutDS.addPendingAnnotation();

    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.selected.text,
      saveButtonLabel: _t('editmodal#save_tags'),
      sections: [{
        id: 'tags',
        required: true,
        focus: true
      }, {
        id: 'notebook'
      }]
    });
  }

  private onTooltipSemantic() {
    const pendingAnnotation = this.layoutDS.addPendingAnnotation();

    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.selected.text,
      saveButtonLabel: _t('editmodal#save_semantic'),
      sections: [{
        id: 'semantic',
        required: true,
        focus: true
      }, {
        id: 'tags',
      }, {
        id: 'notebook'
      }]
    });
  }
}
