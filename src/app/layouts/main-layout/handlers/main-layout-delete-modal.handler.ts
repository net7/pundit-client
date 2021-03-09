import { EMPTY, from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { _t } from '@n7-frontend/core';
import * as annotationModel from 'src/app/models/annotation';
import { AppEvent, DeleteModalEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
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
        case DeleteModalEvent.Confirm:
          this.onDeleteModalConfirm().pipe(
            catchError((e) => {
              this.layoutEH.handleError(e);

              // toast
              this.layoutDS.toastService.error({
                title: _t('toast#annotationdelete_error_title'),
                text: _t('toast#annotationdelete_error_text'),
              });
              return EMPTY;
            })
          ).subscribe((deleteId) => {
            // signal
            this.layoutEH.appEvent$.next({
              type: AppEvent.AnnotationDeleteSuccess,
              payload: deleteId
            });

            // toast
            this.layoutDS.toastService.info({
              title: _t('toast#annotationdelete_success_title'),
              text: _t('toast#annotationdelete_success_text'),
            });
          });
          break;
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
    return from(annotationModel.remove(deleteId)).pipe(
      tap(() => {
        this.layoutDS.anchorService.remove(deleteId);
      }),
      map(() => deleteId)
    );
  }

  private onDeleteModalClose() {
    this.layoutDS.state.annotation.deleteId = null;
  }
}
