import { _t } from "@net7/core";
import { SemanticTripleType } from "@pundit/communication";
import { cloneDeep } from "lodash";
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
import { AnalyticsAction, AnalyticsData } from "src/common/types";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import mapChunks from "./annotation-range-selector.util";
import { EditModalPayloadBuilder } from "./edit-modal-payload.builder";

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
          // Caso UPDATE: qui "data" è ancora un singolo oggetto
          // { requestPayload, isUpdate }, non un array.
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
            // Solo per la PRIMA annotazione eseguiamo il flusso "visibile":
            // chiusura modale, toast di successo, chiusura del working toast.
            // Se lo facessimo per ognuna, avremmo N toast e N tentativi di
            // chiudere un modale già chiuso.
            this.onAnnotationCreated(annotation, workingToast);
          } else {
            // Per le annotazioni successive (generate dall'AI) ripetiamo solo
            // la parte "silenziosa": notifica interna, aggiornamento tag,
            // tracking analytics — senza toast/chiusura modale duplicati.
            this.layoutEH.appEvent$.next({
              type: AppEvent.AnnotationCreateSuccess,
              payload: annotation,
            });
            this.layoutDS.tagService.addMany(annotation?.tags);
            AnalyticsModel.track(
              this.getAnnotationCreatedAnalytics(annotation),
            );
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

    // analytics
    AnalyticsModel.track(this.getAnnotationCreatedAnalytics(data));
  }

  private getAnnotationCreatedAnalytics(data: any): AnalyticsData {
    let analyticsData: AnalyticsData | undefined;
    // comment
    if (data.type === "Commenting") {
      analyticsData = {
        action: AnalyticsAction.CommentAnnotationCreated,
        payload: {
          scope: "fragment",
        },
      };
      // semantic
    } else if (data.type === "Linking") {
      const { content }: { content: SemanticTripleType[] } = data;
      analyticsData = {
        action: AnalyticsAction.SemanticAnnotationCreated,
        payload: {
          scope: "fragment",
          predicate: content.map(({ predicate }) => predicate.label),
          "object-type": content.map(({ objectType }) => objectType),
          "object-lod": content.map((triple) =>
            triple.objectType === "uri" ? triple.object.label : null,
          ),
          "number-triples": content.length,
        },
      };
      // tags
    } else if (Array.isArray(data.tags) && data.tags.length) {
      analyticsData = {
        action: AnalyticsAction.TagAnnotationCreated,
        payload: {
          scope: "fragment",
          tags: data.tags,
        },
      };
    }
    return analyticsData!;
  }

  private onCreateNotebookError(payload: any) {
    this.layoutEH.handleError(payload);

    // toast
    this.layoutDS.toastService.error({
      title: _t("toast#genericerror_title"),
      text: _t("toast#genericerror_text"),
    });
  }

  private onCreateNotebookSuccess() {
    // signal
    this.layoutEH.appEvent$.next({
      type: AppEvent.NotebookCreateSuccess,
    });

    // analytics
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

    // analytics
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

  /*
   Qui adesso costruisco i payload da salvare, normalizzando però 
   la forma salvando tutto tramite una array, sia che il payload sia singolo,
   quindi un'annotazione normale e sia che il payload sia multiplo, quando contiene le 
   risposte dell'IA
   */
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

        return from(
          Promise.all(
            payloadsToSave.map((p) =>
              firstValueFrom(this.layoutDS.saveAnnotation(p)),
            ),
          ),
        );
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

  /*
  Qui viene preso il payload e nel caso in cui
  l'utente abbia mandato un prompt AI, viene chiamata la funzione mapChunks che ritorna un array di payload
   */
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
