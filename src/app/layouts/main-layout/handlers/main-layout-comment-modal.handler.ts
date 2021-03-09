import { _t } from '@n7-frontend/core';
import { Notebook } from '@pundit/communication';
import { EMPTY, from, of } from 'rxjs';
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
import * as notebookModel from 'src/app/models/notebook';
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
          });
          break;
        case CommentModalEvent.Save: {
          this.onCommentModalSave().pipe(
            catchError((e) => {
              this.layoutEH.handleError(e);

              // toast
              this.layoutDS.toastService.error({
                title: _t('toast#genericerror_error_title'),
                text: _t('toast#genericerror_error_text'),
              });
              return EMPTY;
            }),
            filter((data) => data)
          ).subscribe(({ isUpdate, requestPayload }) => {
            if (isUpdate) {
              // signal
              this.layoutEH.appEvent$.next({
                type: AppEvent.CommentUpdate,
                payload: requestPayload
              });
            } else {
              // toast
              this.layoutDS.toastService.success({
                title: _t('toast#annotationsave_success_title'),
                text: _t('toast#annotationsave_success_text'),
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
    return from(notebookModel.create({
      data: {
        label: payload,
        sharingMode: 'public',
        userId: iam,
      }
    })).pipe(
      tap(({ data }) => {
        const rawNotebook: Notebook = {
          id: data.id,
          changed: new Date(),
          created: new Date(),
          label: payload,
          sharingMode: 'public',
          userId: iam
        };
        this.layoutDS.notebookService.add(rawNotebook);
        this.layoutDS.state.comment.notebookId = data.id;
      }),
      map(({ data }) => ({
        notebookList: this.layoutDS.notebookService.getByUserId(iam),
        selectedNotebook: this.layoutDS.notebookService.getNotebookById(data.id)
      }))
    );
  }

  private onCommentModalSave() {
    const { comment } = this.layoutDS.state.comment;
    let source$ = of(null);
    if (typeof comment === 'string' && comment.trim()) {
      const requestPayload = this.layoutDS.state.annotation.pendingPayload
        ? this.getCommentRequestPayload(
          this.layoutDS.state.annotation.pendingPayload,
          this.layoutDS.state.comment
        ) : this.getCommentRequestPayload(
          this.layoutDS.state.annotation.updatePayload,
          this.layoutDS.state.comment
        );
      if (requestPayload && !this.layoutDS.state.annotation.updatePayload) {
        source$ = this.layoutDS.saveAnnotation(requestPayload);
      } else if (requestPayload && this.layoutDS.state.annotation.updatePayload) {
        source$ = of({ requestPayload, isUpdate: true });
      }
    }
    return source$;
  }

  private onCommentModalClose() {
    // clear pending
    this.layoutDS.removePendingAnnotation();
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
