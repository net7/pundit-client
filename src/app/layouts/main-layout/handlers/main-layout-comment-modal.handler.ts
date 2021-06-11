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
import { EditModalState, MainLayoutDS } from '../main-layout.ds';
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
          this.onEditModalTextChange(payload);
          break;
        case CommentModalEvent.NotebookChange:
          this.onEditModalNotebookChange(payload);
          break;
        case CommentModalEvent.CreateNotebook:
          this.onEditModalCreateNotebook(payload).pipe(
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
          const { isUpdate } = this.layoutDS.state.editModal;
          let workingToast: ToastInstance;
          if (!isUpdate) {
            // toast "working..."
            workingToast = this.layoutDS.toastService.working();
          }
          this.onEditModalSave().pipe(
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
          this.onEditModalClose();
          break;
        default:
          break;
      }
    });
  }

  private onEditModalTextChange(payload: string) {
    this.layoutDS.state.editModal.comment = payload;
  }

  private onEditModalNotebookChange(payload: string) {
    this.layoutDS.state.editModal.notebookId = payload;

    // set selected notebook as the default
    this.layoutDS.notebookService.setSelected(payload);
    this.layoutEH.appEvent$.next({
      type: AppEvent.SelectedNotebookChanged
    });
  }

  private onEditModalCreateNotebook(payload) {
    const iam = this.layoutDS.userService.whoami().id;
    return this.layoutDS.notebookService.create(payload).pipe(
      tap(({ data }) => {
        this.layoutDS.state.editModal.notebookId = data.id;
      }),
      map(({ data }) => ({
        notebookList: this.layoutDS.notebookService.getByUserId(iam),
        selectedNotebook: this.layoutDS.notebookService.getNotebookById(data.id)
      }))
    );
  }

  private onEditModalSave() {
    const { isUpdate } = this.layoutDS.state.editModal;
    let source$ = of(null);
    if (isUpdate) {
      const updateRequestPayload = this.getEditRequestPayload(
        this.layoutDS.state.annotation.updatePayload,
        this.layoutDS.state.editModal
      );
      source$ = of({ requestPayload: updateRequestPayload, isUpdate });
    } else {
      const pendingRequestPayload = this.getEditRequestPayload(
        this.layoutDS.state.annotation.pendingPayload,
        this.layoutDS.state.editModal
      );
      source$ = this.layoutDS.saveAnnotation(pendingRequestPayload);
    }
    this.layoutDS.state.editModal = {
      isOpen: false,
      notebookId: null,
      comment: null,
      tags: null
    };
    return source$;
  }

  private onEditModalClose() {
    // clear pending
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.state.editModal = {
      isOpen: false,
      notebookId: null,
      comment: null,
      tags: null
    };
  }

  private getEditRequestPayload(payload, modalState: EditModalState) {
    if (modalState.notebookId) {
      payload.notebookId = modalState.notebookId;
    }
    if (modalState?.comment) {
      payload.type = 'Commenting';
      payload.content = {
        comment: modalState?.comment.trim()
      };
    } else {
      payload.type = 'Highlighting';
      payload.content = undefined;
    }
    if (modalState?.tags?.values) {
      payload.tags = modalState?.tags?.values;
    }
    return payload;
  }
}
