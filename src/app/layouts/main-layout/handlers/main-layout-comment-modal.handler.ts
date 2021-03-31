import { _t } from '@n7-frontend/core';
import { EMPTY, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  tap
} from 'rxjs/operators';
import {
  AppEvent,
  CommentModalEvent,
  getEventType,
  MainLayoutEvent
} from 'src/app/event-types';
import { _c } from 'src/app/models/config';
import { ToastInstance } from 'src/app/services/toast.service';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutCommentModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case CommentModalEvent.TextChange:
          this.onCommentModalTextChange(payload);
          break;
        case CommentModalEvent.NotebookChange:
          this.onCommentModalNotebookChange(payload);
          break;
        case CommentModalEvent.CreateNotebook:
          this.onCommentModalCreateNotebook(payload).pipe(
            catchError((e) => {
              this.layoutEH.handleError(e);

              // toast
              this.layoutDS.toastService.error({
                title: _t('toast#genericerror_error_title'),
                text: _t('toast#genericerror_error_text'),
              });
              return EMPTY;
            })
          ).subscribe(({ notebookList, selectedNotebook }) => {
            // signal
            this.layoutEH.emitOuter(getEventType(MainLayoutEvent.UpdateNotebookSelect), {
              notebookList,
              selectedNotebook
            });
            this.layoutEH.appEvent$.next({
              type: AppEvent.NotebookCreateSuccess
            });
          });
          break;
        case CommentModalEvent.Save: {
          const { isUpdate } = this.layoutDS.state.comment;
          let workingToast: ToastInstance;
          if (!isUpdate) {
            // toast "working..."
            workingToast = this.layoutDS.toastService.working();
          }
          this.onCommentModalSave().pipe(
            catchError((e) => {
              this.layoutEH.handleError(e);
              // toast
              this.layoutDS.toastService.error({
                title: _t('toast#genericerror_error_title'),
                text: _t('toast#genericerror_error_text'),
                timer: _c('toastTimer'),
                onLoad: () => {
                  workingToast.close();
                }
              });
              return EMPTY;
            }),
            filter((data) => data)
          ).subscribe((data) => {
            if (data.isUpdate) {
              // signal
              this.layoutEH.appEvent$.next({
                type: AppEvent.CommentUpdate,
                payload: data.requestPayload
              });
            } else {
              // clear pending
              this.layoutDS.state.annotation.pendingPayload = null;

              // signal
              this.layoutEH.appEvent$.next({
                type: AppEvent.AnnotationCreateSuccess,
                payload: data
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
            }
          });
          break;
        }
        case CommentModalEvent.Close:
          this.onCommentModalClose();
          break;
        default:
          break;
      }
    });
  }

  private onCommentModalTextChange(payload: string) {
    this.layoutDS.state.comment.comment = payload;
  }

  private onCommentModalNotebookChange(payload: string) {
    this.layoutDS.state.comment.notebookId = payload;
  }

  private onCommentModalCreateNotebook(payload) {
    const iam = this.layoutDS.userService.whoami().id;
    return this.layoutDS.notebookService.create(payload).pipe(
      tap(({ data }) => {
        this.layoutDS.state.comment.notebookId = data.id;
      }),
      map(({ data }) => ({
        notebookList: this.layoutDS.notebookService.getByUserId(iam),
        selectedNotebook: this.layoutDS.notebookService.getNotebookById(data.id)
      }))
    );
  }

  private onCommentModalSave() {
    const { comment, isUpdate } = this.layoutDS.state.comment;
    let source$ = of(null);
    if (typeof comment === 'string' && comment.trim()) {
      if (isUpdate) {
        const updateRequestPayload = this.getCommentRequestPayload(
          this.layoutDS.state.annotation.updatePayload,
          this.layoutDS.state.comment
        );
        source$ = of({ requestPayload: updateRequestPayload, isUpdate });
      } else {
        const pendingRequestPayload = this.getCommentRequestPayload(
          this.layoutDS.state.annotation.pendingPayload,
          this.layoutDS.state.comment
        );
        source$ = this.layoutDS.saveAnnotation(pendingRequestPayload);
      }
    }
    this.layoutDS.state.comment = {
      isOpen: false,
      notebookId: null,
      comment: null
    };
    return source$;
  }

  private onCommentModalClose() {
    // clear pending
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.state.comment = {
      isOpen: false,
      notebookId: null,
      comment: null
    };
  }

  private getCommentRequestPayload(payload, { comment, notebookId }) {
    payload.type = 'Commenting';
    payload.content = {
      comment: comment.trim()
    };
    if (notebookId) {
      payload.notebookId = notebookId;
    }
    return payload;
  }
}
