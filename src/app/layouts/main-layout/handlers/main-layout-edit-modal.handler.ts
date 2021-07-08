import { _t } from '@n7-frontend/core';
import { EMPTY, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { EditModalFormState } from 'src/app/components/edit-modal/edit-modal';
import { AppEvent, EditModalEvent } from 'src/app/event-types';
import { _c } from 'src/app/models/config';
import { ToastInstance } from 'src/app/services/toast.service';
import { LayoutHandler } from 'src/app/types';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutEditModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case EditModalEvent.NotebookChange:
          this.onEditModalNotebookChange();
          break;
        case EditModalEvent.Close:
          this.onEditModalClose();
          break;
        case EditModalEvent.Save: {
          const isUpdate = this.isUpdate();
          let workingToast: ToastInstance;
          if (!isUpdate) {
            // toast "working..."
            workingToast = this.layoutDS.toastService.working();
          }
          this.onEditModalSave(payload).pipe(
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
            // clear previous annotation payload
            this.layoutDS.state.annotation.pendingPayload = null;
            this.layoutDS.state.annotation.updatePayload = null;

            if (data.isUpdate) {
              // signal
              this.layoutEH.appEvent$.next({
                type: AppEvent.CommentUpdate,
                payload: data.requestPayload
              });
            } else {
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

              // update tags;
              this.layoutDS.tagService.addMany(data?.tags);

              // analytics
              AnalyticsModel.track({
                action: AnalyticsAction.CommentCreated,
                payload: {
                  scope: 'fragment'
                }
              });
            }
          });
        } break;
        case EditModalEvent.CreateNotebookError:
          this.onCreateNotebookError(payload);
          break;
        case EditModalEvent.CreateNotebookSuccess:
          this.onCreateNotebookSuccess();
          break;
        default:
          break;
      }
    });
  }

  private onCreateNotebookError(payload) {
    this.layoutEH.handleError(payload);

    // toast
    this.layoutDS.toastService.error({
      title: _t('toast#genericerror_error_title'),
      text: _t('toast#genericerror_error_text'),
    });
  }

  private onCreateNotebookSuccess() {
    // signal
    this.layoutEH.appEvent$.next({
      type: AppEvent.NotebookCreateSuccess
    });

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.NotebookCreated,
      payload: {
        location: 'modal'
      }
    });
  }

  private onEditModalNotebookChange() {
    this.layoutEH.appEvent$.next({
      type: AppEvent.SelectedNotebookChanged
    });

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.NotebookCurrentChanged,
      payload: {
        location: 'modal'
      }
    });
  }

  private onEditModalClose() {
    // clear pending
    this.layoutDS.removePendingAnnotation();
  }

  private onEditModalSave(payload) {
    const isUpdate = this.isUpdate();
    let source$ = of(null);
    if (isUpdate) {
      const updateRequestPayload = this.getEditRequestPayload(
        this.layoutDS.state.annotation.updatePayload,
        payload
      );
      source$ = of({ requestPayload: updateRequestPayload, isUpdate });
    } else {
      const pendingRequestPayload = this.getEditRequestPayload(
        this.layoutDS.state.annotation.pendingPayload,
        payload
      );
      source$ = this.layoutDS.saveAnnotation(pendingRequestPayload);
    }
    return source$;
  }

  private getEditRequestPayload(annotationPayload, formState: EditModalFormState) {
    const notebook = formState?.notebook?.value || null;
    const comment = typeof formState?.comment?.value === 'string'
      ? formState?.comment?.value.trim()
      : null;
    const tags = formState?.tags?.value || null;
    const semantic = formState?.semantic?.value || null;
    // check notebook value
    if (notebook) {
      annotationPayload.notebookId = notebook;
    }
    // check comment value
    if (comment) {
      annotationPayload.type = 'Commenting';
      annotationPayload.content = { comment };
    } else {
      annotationPayload.type = 'Highlighting';
      annotationPayload.content = undefined;
    }
    // check tags value
    if (Array.isArray(tags)) {
      annotationPayload.tags = tags.length ? tags : undefined;
    }
    // check semantic value
    if (Array.isArray(semantic)) {
      annotationPayload.type = 'Linking';
      annotationPayload.content = semantic.length ? semantic.map(({ predicate, object }) => ({
        predicate: {
          label: predicate.label,
          uri: predicate.uri
        },
        objectType: 'literal',
        object: {
          text: object.label
        }
      })) : undefined;
    }
    return annotationPayload;
  }

  private isUpdate = () => !!this.layoutDS.state.annotation.updatePayload;
}
