import { _t } from "@net7/core";
import { cloneDeep, uniq } from "lodash";
import { Observable, firstValueFrom, from } from "rxjs";
import { EditModalFormState } from "src/app/components/edit-modal/edit-modal";
import { AppEvent } from "src/app/event-types";
import { _c } from "src/app/models/config";
import { ToastInstance } from "src/app/services/toast.service";
import { AnalyticsModel } from "src/common/models";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import mapChunks from "./annotation-range-selector.util";
import { EditModalPayloadBuilder } from "./edit-modal-payload.builder";
import { isValidAnnotationPayload } from "./edit-modal-validation";
import { getAnnotationCreatedAnalytics } from "./edit-modal-analytics";
import { aiPreviewState$ } from "src/app/components/edit-modal/edit-modal";

const AI_PREVIEW_ID_PREFIX = "ai-preview-";

export class MainLayoutEditModalAiHandler {
  private aiPreviewPayloads: any[] = [];

  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH,
  ) {}

  async onAiGenerate(prompt: string) {
    const pendingPayload = this.layoutDS.state.annotation.pendingPayload;
    if (!pendingPayload) {
      console.warn("[AiGenerate] Nessun pendingPayload disponibile");
      return;
    }

    const workingToast = this.layoutDS.toastService.working();

    const pendingAnnotation =
      this.layoutDS.annotationService.getAnnotationFromPayload(
        this.layoutDS.pendingAnnotationId,
        pendingPayload,
      );
    this.layoutDS.anchorService.add(pendingAnnotation);

    const annotationPayload = cloneDeep(pendingPayload);
    EditModalPayloadBuilder.applyFormValuesToPayload(annotationPayload, {
      notebook: { value: this.layoutDS.notebookService.getSelected()?.id },
    });

    this.removeAiPreviews();

    try {
      const aiPayloads = await mapChunks(annotationPayload, prompt);
      if (!aiPayloads || aiPayloads.length === 0) {
        console.warn("[AiGenerate] Nessun payload generato dall'AI");
        workingToast.close();
        this.layoutDS.toastService.info({
          title: _t("toast#ai_no_results_title"),
          text: _t("toast#ai_no_results_text"),
          timer: _c("toastTimer"),
        });
        return;
      }

      this.aiPreviewPayloads = aiPayloads;

      this.layoutDS.removePendingAnnotation();

      for (let i = 0; i < aiPayloads.length; i++) {
        const aiPayload = aiPayloads[i];
        const previewId = `${AI_PREVIEW_ID_PREFIX}${i}`;
        const previewAnnotation =
          this.layoutDS.annotationService.getAnnotationFromPayload(
            previewId,
            aiPayload,
          );
        await this.layoutDS.anchorService.add(
          previewAnnotation,
          _c("highlightAiPreviewTag") as string,
        );
      }

      workingToast.close();
      aiPreviewState$.next(true);
    } catch (error) {
      console.error("[AiGenerate] Errore durante la generazione AI:", error);
      workingToast.close();
      this.layoutDS.toastService.error({
        title: _t("toast#genericerror_title"),
        text: _t("toast#genericerror_text"),
        timer: _c("toastTimer"),
      });
    }
  }

  onAiAccept() {
    if (!this.aiPreviewPayloads.length) {
      return;
    }

    const workingToast = this.layoutDS.toastService.working();
    const payloadsToSave = this.aiPreviewPayloads;

    this.removeAiPreviews();
    aiPreviewState$.next(false);

    this.saveAnnotationsSequentially(payloadsToSave).subscribe({
      next: (savedAnnotations) => {
        savedAnnotations.forEach((annotation, index) => {
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
        this.layoutDS.state.annotation.pendingPayload = null;
        this.layoutDS.state.annotation.updatePayload = null;
      },
      error: (e) => {
        this.layoutEH.handleError(e);
        this.layoutDS.toastService.error({
          title: _t("toast#annotationsave_error_title"),
          text: _t("toast#annotationsave_error_text"),
          timer: _c("toastTimer"),
          onLoad: () => {
            workingToast.close();
          },
        });
      },
    });
  }

  onAiDiscard() {
    this.removeAiPreviews();
    aiPreviewState$.next(false);

    const pendingPayload = this.layoutDS.state.annotation.pendingPayload;
    if (pendingPayload) {
      const pendingAnnotation =
        this.layoutDS.annotationService.getAnnotationFromPayload(
          this.layoutDS.pendingAnnotationId,
          pendingPayload,
        );
      this.layoutDS.anchorService.add(pendingAnnotation);
    }
  }

  removeAiPreviews() {
    this.layoutDS.anchorService.removeByPrefix(AI_PREVIEW_ID_PREFIX);
    this.aiPreviewPayloads = [];
  }

  private onAnnotationCreated(data: any, workingToast: ToastInstance) {
    this.layoutEH.emitOuter("annotation-created", { payload: data });
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

  async getEditRequestPayload(
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
    if (aiPayloads && Array.isArray(aiPayloads)) {
      aiPayloads.forEach((payload) => {
        const aiType = payload.type;
        const aiContent = payload.content;
        const aiTags = payload.tags;
        const aiSelected = payload.subject?.selected;
        EditModalPayloadBuilder.applyFormValuesToPayload(payload, formState);
        if (aiType) {
          payload.type = aiType;
        }
        if (aiContent !== undefined) {
          payload.content = aiContent;
        }
        const formTags = payload.tags;
        payload.tags = uniq([...(formTags || []), ...(aiTags || [])]);
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
}
