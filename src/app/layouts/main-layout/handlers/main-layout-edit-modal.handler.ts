import { _t } from "@net7/core";
import { cloneDeep, uniq } from "lodash";
import { EMPTY, Observable, firstValueFrom, from } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { EditModalFormState } from "src/app/components/edit-modal/edit-modal";
import {
  AppEvent,
  EditModalEvent,
  MainLayoutEvent,
  getEventType,
} from "src/app/event-types";
import { _c } from "src/app/models/config";
import { ToastInstance } from "src/app/services/toast.service";
import { LayoutHandler } from "src/app/types";
import { AnalyticsModel } from "src/common/models";
import { AnalyticsAction } from "src/common/types";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import mapChunks from "./annotation-range-selector.util";
import { EditModalPayloadBuilder } from "./edit-modal-payload.builder";
import { isValidAnnotationPayload } from "./edit-modal-validation";
import { getAnnotationCreatedAnalytics } from "./edit-modal-analytics";

export class MainLayoutEditModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH,
  ) {}

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
          // toast di errore generico se il salvataggio fallisce
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

  private onAnnotationCreated(data: any, workingToast: ToastInstance) {
    // signal
    this.layoutEH.emitOuter(getEventType(MainLayoutEvent.AnnotationCreated), {
      payload: data,
    });
    this.layoutEH.appEvent$.next({
      type: AppEvent.AnnotationCreateSuccess,
      payload: data,
    });

    // toast
    this.layoutDS.toastService.success({
      title: _t("toast#annotationsave_success_title"),
      text: _t("toast#annotationsave_success_text"),
      timer: _c("toastTimer"),
      onLoad: () => {
        workingToast.close();
      },
    });

    // update tags;
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
      payload: {
        location: "modal",
      },
    });
  }

  private onEditModalNotebookChange() {
    this.layoutEH.appEvent$.next({
      type: AppEvent.SelectedNotebookChanged,
    });

    AnalyticsModel.track({
      action: AnalyticsAction.NotebookCurrentChanged,
      payload: {
        location: "modal",
      },
    });
  }

  private onEditModalClose() {
    // clear pending
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

  private onEditModalSave(payload: any): Observable<any> {
    const isUpdate = this.isUpdate();

    if (isUpdate) {
      const updatePayload = this.layoutDS.state.annotation.updatePayload;
      if (!updatePayload) {
        return this.missingAnnotationPayloadError("update");
      }

      return from(
        this.getEditRequestPayload(cloneDeep(updatePayload), payload),
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
      this.getEditRequestPayload(cloneDeep(pendingPayload), payload),
    ).pipe(
      switchMap(({ payload: pendingRequestPayload, aiPayloads }) => {
        const payloadsToSave =
          aiPayloads && aiPayloads.length
            ? aiPayloads
            : [pendingRequestPayload];

        // Salva le annotazioni in sequenza (non in parallelo) per evitare
        // race condition sul refresh del token JWT che causa 401.
        return this.saveAnnotationsSequentially(payloadsToSave);
      }),
    );
  }

  private missingAnnotationPayloadError(mode: "create" | "update") {
    return new Observable<never>((subscriber) => {
      subscriber.error(
        new Error(`Cannot save annotation ${mode}: missing annotation payload`),
      );
    });
  }

  private async getEditRequestPayload(
    annotationPayload: any,
    formState: EditModalFormState,
  ): Promise<{ payload: any; aiPayloads: any[] | null }> {
    EditModalPayloadBuilder.applyFormValuesToPayload(
      annotationPayload,
      formState,
    );
    const aiPayloads = await this.generateAiPayloads(
      annotationPayload,
      formState?.aiRequest?.value,
    );
    console.warn(annotationPayload);
    // I payload generati dall'IA hanno già type e content corretti
    // impostati da addPayloadForRange in base a annotation_type.
    // Applichiamo i valori della form (notebook, tags) ma preserviamo
    // type e content che sono stati impostati dall'IA.
    if (aiPayloads && Array.isArray(aiPayloads)) {
      aiPayloads.forEach((payload) => {
        // Salva type, content e tags originali impostati dall'IA
        const aiType = payload.type;
        const aiContent = payload.content;
        const aiTags = payload.tags;
        // Preserva il subject.selected originale (calcolato dall'IA)
        const aiSelected = payload.subject?.selected;
        // Applica i form values (notebook, tags della form)
        EditModalPayloadBuilder.applyFormValuesToPayload(payload, formState);
        // Ripristina type e content impostati dall'IA
        if (aiType) {
          payload.type = aiType;
        }
        if (aiContent !== undefined) {
          payload.content = aiContent;
        }
        // I tag dell'IA si sommano a quelli della form, rimuovendo duplicati
        const formTags = payload.tags;
        payload.tags = uniq([...(formTags || []), ...(aiTags || [])]);
        // Ripristina il subject.selected generato dall'IA
        if (aiSelected && payload.subject) {
          payload.subject.selected = aiSelected;
        }
      });
    }

    return { payload: annotationPayload, aiPayloads };
  }

  private async generateAiPayloads(
    annotationPayload: any,
    aiRequestValue: any,
  ): Promise<any[] | null> {
    const aiRequest =
      typeof aiRequestValue === "string" ? aiRequestValue.trim() : null;
    return aiRequest ? mapChunks(annotationPayload, aiRequest) : null;
  }

  private isUpdate = () => !!this.layoutDS.state.annotation.updatePayload;
}
