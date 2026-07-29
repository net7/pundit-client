import { _t } from "@net7/core";
import { cloneDeep } from "lodash";
import { EMPTY, Observable, firstValueFrom, from } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { _c } from "src/app/models/config";
import {
  AppEvent,
  EditModalEvent,
  MainLayoutEvent,
  getEventType,
} from "src/app/event-types";
import { ToastInstance } from "src/app/services/toast.service";
import { LayoutHandler } from "src/app/types";
import { AnalyticsModel } from "src/common/models";
import { AnalyticsAction } from "src/common/types";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import { isValidAnnotationPayload } from "./edit-modal-validation";
import { getAnnotationCreatedAnalytics } from "./edit-modal-analytics";
import { MainLayoutEditModalAiHandler } from "./main-layout-edit-modal-ai.handler";

export class MainLayoutEditModalHandler implements LayoutHandler {
  private aiHandler: MainLayoutEditModalAiHandler;

  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH,
  ) {
    this.aiHandler = new MainLayoutEditModalAiHandler(layoutDS, layoutEH);
  }

  listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case EditModalEvent.NotebookChange:
          this.onEditModalNotebookChange();
          break;
        case EditModalEvent.Close:
          this.onEditModalClose();
          break;
        case EditModalEvent.Save:
          this.onEditModalSaveEvent(payload);
          break;
        case EditModalEvent.CreateNotebookError:
          this.onCreateNotebookError(payload);
          break;
        case EditModalEvent.CreateNotebookSuccess:
          this.onCreateNotebookSuccess();
          break;
        case EditModalEvent.AiGenerate:
          this.aiHandler.onAiGenerate(payload);
          break;
        case EditModalEvent.AiAccept:
          this.aiHandler.onAiAccept();
          break;
        case EditModalEvent.AiDiscard:
          this.aiHandler.onAiDiscard();
          break;
        default:
          break;
      }
    });
  }

  private onEditModalSaveEvent(payload: any) {
    const isUpdate = this.isUpdate();
    let workingToast: ToastInstance;
    if (!isUpdate) {
      workingToast = this.layoutDS.toastService.working();
    }
    this.onEditModalSave(payload)
      .pipe(
        catchError((e) => {
          this.layoutEH.handleError(e);
          this.layoutDS.toastService.error({
            title: _t("toast#annotationsave_error_title"),
            text: _t("toast#annotationsave_error_text"),
            timer: _c("toastTimer"),
            onLoad: () => {
              workingToast.close();
            },
          });
          return EMPTY;
        }),
        filter((data) => data),
      )
      .subscribe((data) => {
        this.layoutDS.state.annotation.pendingPayload = null;
        this.layoutDS.state.annotation.updatePayload = null;

        if (isUpdate) {
          this.layoutEH.appEvent$.next({
            type: AppEvent.CommentUpdate,
            payload: data.requestPayload,
          });
          this.layoutEH.emitOuter(
            getEventType(MainLayoutEvent.AnnotationCreated),
          );
          return;
        }

        const createdAnnotations: any[] = data;
        createdAnnotations.forEach((annotation, index) => {
          if (index === 0) {
            this.onAnnotationCreated(annotation, workingToast);
          } else {
            this.layoutEH.appEvent$.next({
              type: AppEvent.AnnotationCreateSuccess,
              payload: annotation,
            });
            this.layoutDS.tagService.addMany(annotation?.tags);
            AnalyticsModel.track(getAnnotationCreatedAnalytics(annotation));
          }
        });
      });
  }

  private onEditModalSave(payload: any): Observable<any> {
    const isUpdate = this.isUpdate();

    if (isUpdate) {
      const updatePayload = this.layoutDS.state.annotation.updatePayload;
      if (!updatePayload) {
        return this.missingAnnotationPayloadError("update");
      }
      return from(
        this.aiHandler.getEditRequestPayload(cloneDeep(updatePayload), payload),
      ).pipe(
        map(({ payload: updateRequestPayload }) => ({
          requestPayload: updateRequestPayload,
          isUpdate,
        })),
      );
    }

    const pendingPayload = this.layoutDS.state.annotation.pendingPayload;
    if (!pendingPayload) {
      return this.missingAnnotationPayloadError("create");
    }

    return from(
      this.aiHandler.getEditRequestPayload(cloneDeep(pendingPayload), payload),
    ).pipe(
      switchMap(({ payload: pendingRequestPayload, aiPayloads }) => {
        const payloadsToSave =
          aiPayloads && aiPayloads.length
            ? aiPayloads
            : [pendingRequestPayload];
        return this.saveAnnotationsSequentially(payloadsToSave);
      }),
    );
  }

  private onAnnotationCreated(data: any, workingToast: ToastInstance) {
    this.layoutEH.emitOuter(getEventType(MainLayoutEvent.AnnotationCreated), {
      payload: data,
    });
    this.layoutEH.appEvent$.next({
      type: AppEvent.AnnotationCreateSuccess,
      payload: data,
    });

    this.layoutDS.toastService.success({
      title: _t("toast#annotationsave_success_title"),
      text: _t("toast#annotationsave_success_text"),
      timer: _c("toastTimer"),
      onLoad: () => {
        workingToast.close();
      },
    });

    this.layoutDS.tagService.addMany(data?.tags);
    AnalyticsModel.track(getAnnotationCreatedAnalytics(data));
  }

  private onCreateNotebookError(payload: any) {
    this.layoutEH.handleError(payload);
    this.layoutDS.toastService.error({
      title: _t("toast#genericerror_title"),
      text: _t("toast#genericerror_text"),
    });
  }

  private onCreateNotebookSuccess() {
    this.layoutEH.appEvent$.next({
      type: AppEvent.NotebookCreateSuccess,
    });
    AnalyticsModel.track({
      action: AnalyticsAction.NotebookCreated,
      payload: { location: "modal" },
    });
  }

  private onEditModalNotebookChange() {
    this.layoutEH.appEvent$.next({
      type: AppEvent.SelectedNotebookChanged,
    });
    AnalyticsModel.track({
      action: AnalyticsAction.NotebookCurrentChanged,
      payload: { location: "modal" },
    });
  }

  private onEditModalClose() {
    this.aiHandler.removeAiPreviews();
    this.layoutDS.removePendingAnnotation();
  }

  private saveAnnotationsSequentially(payloads: any[]): Observable<any[]> {
    return from(
      (async (): Promise<any[]> => {
        const saved: any[] = [];
        for (const p of payloads) {
          if (isValidAnnotationPayload(p)) {
            try {
              const result = await firstValueFrom(
                this.layoutDS.saveAnnotation(p),
              );
              saved.push(result);
            } catch (error) {
              console.error(
                "[saveAnnotation] Errore salvataggio annotazione:",
                error,
              );
            }
          }
        }
        return saved;
      })(),
    );
  }

  private missingAnnotationPayloadError(mode: "create" | "update") {
    return new Observable<never>((subscriber) => {
      subscriber.error(
        new Error(`Cannot save annotation ${mode}: missing annotation payload`),
      );
    });
  }

  private isUpdate = () => !!this.layoutDS.state.annotation.updatePayload;
}
