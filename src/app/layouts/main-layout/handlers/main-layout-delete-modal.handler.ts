import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { _t } from '@n7-frontend/core';
import { _c } from 'src/app/models/config';
import { AppEvent, DeleteModalEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { AnnotationCssClass } from 'src/app/data-sources';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutDeleteModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    this.layoutEH.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case DeleteModalEvent.Confirm: {
          const { deleteId } = this.layoutDS.state.annotation;
          // toast "working..."
          const workingToast = this.layoutDS.toastService.working();
          // update loading state
          this.layoutDS.annotationService.updateCached(deleteId, {
            cssClass: AnnotationCssClass.Delete
          });
          this.onDeleteModalConfirm().pipe(
            catchError((e) => {
              this.layoutEH.handleError(e);

              // toast
              this.layoutDS.toastService.error({
                title: _t('toast#annotationdelete_error_title'),
                text: _t('toast#annotationdelete_error_text'),
                timer: _c('toastTimer'),
                onLoad: () => {
                  workingToast.close();
                }
              });
              return EMPTY;
            })
          ).subscribe(() => {
            // signal
            this.layoutEH.appEvent$.next({
              type: AppEvent.AnnotationDeleteSuccess,
              payload: deleteId
            });

            // toast
            this.layoutDS.toastService.success({
              title: _t('toast#annotationdelete_success_title'),
              text: _t('toast#annotationdelete_success_text'),
              timer: _c('toastTimer'),
              onLoad: () => {
                workingToast.close();
              }
            });
          });
          break;
        }
        case DeleteModalEvent.Close:
          this.onDeleteModalClose();
          break;
        default:
          break;
      }
    });
  }

  private onDeleteModalConfirm() {
    const { deleteId } = this.layoutDS.state.annotation;
    return this.layoutDS.annotationService.remove(deleteId).pipe(
      tap(() => {
        this.layoutDS.anchorService.remove(deleteId);
      })
    );
  }

  private onDeleteModalClose() {
    this.layoutDS.state.annotation.deleteId = null;
  }
}
