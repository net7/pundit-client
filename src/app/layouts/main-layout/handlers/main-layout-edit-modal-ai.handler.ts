import { _t } from "@net7/core";
import { cloneDeep } from "lodash";
import { Observable, firstValueFrom, from } from "rxjs";
import { AppEvent, MainLayoutEvent, getEventType } from "src/app/event-types";
import { _c } from "src/app/models/config";
import { ToastInstance } from "src/app/services/toast.service";
import { AnalyticsModel } from "src/common/models";
import {
  AiAnnotateErrorCode,
  AiAnnotateErrorResponse,
  AiAnnotationType,
} from "src/communication";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import { prepareAiRequest } from "./annotation-range-selector.util";
import { processLLMResponse } from "./annotation-llm-processor";
import { EditModalPayloadBuilder } from "./edit-modal-payload.builder";
import { isValidAnnotationPayload } from "./edit-modal-validation";
import { getAnnotationCreatedAnalytics } from "./edit-modal-analytics";
import { aiPreviewState$ } from "src/app/components/edit-modal/edit-modal";

const AI_PREVIEW_ID_PREFIX = "ai-preview-";

const AI_ANNOTATION_TYPES: AiAnnotationType[] = [
  "highlight",
  "comment",
  "tags",
  "semantic_annotation",
];

const toAiAnnotationType = (value?: string): AiAnnotationType =>
  AI_ANNOTATION_TYPES.find((type) => type === value) ?? "highlight";

/** Backend error codes with a dedicated message (i18n key toast#ai_error_<code>). */
const AI_ERROR_CODES: AiAnnotateErrorCode[] = [
  "payload_too_large",
  "no_active_api_key",
  "structured_output_unsupported",
  "model_unavailable",
  "invalid_structured_output",
];

const getAiErrorCode = (error: any): AiAnnotateErrorCode | undefined => {
  const code = (error?.response?.data as AiAnnotateErrorResponse | undefined)
    ?.code;
  const known = AI_ERROR_CODES.find((c) => c === code);
  // A 413 can also come from a proxy (e.g. nginx) with no JSON body.
  return known ?? (error?.response?.status === 413 ? "payload_too_large" : undefined);
};

export class MainLayoutEditModalAiHandler {
  private aiPreviewPayloads: any[] = [];

  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH,
  ) {}

  async onAiGenerate(request: { prompt: string; annotationType?: string }) {
    const prompt = request?.prompt || "";
    const annotationType = toAiAnnotationType(request?.annotationType);

    const pendingPayload = this.layoutDS.state.annotation.pendingPayload;
    if (!pendingPayload) {
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
      const aiPayloads = await this.requestAiPayloads(
        annotationPayload,
        prompt,
        annotationType,
      );
      if (aiPayloads.length === 0) {
        workingToast.close();
        aiPreviewState$.next(false);
        this.layoutDS.toastService.info({
          title: _t("toast#ai_no_results_title"),
          text: _t("toast#ai_no_results_text"),
          timer: _c("toastTimer"),
        });
        return;
      }

      await this.renderAiPreviews(aiPayloads);

      workingToast.close();
      aiPreviewState$.next(true);
      this.layoutEH.appEvent$.next({
        type: AppEvent.AiPreviewReady,
      });
    } catch (error) {
      workingToast.close();
      aiPreviewState$.next(false);
      this.onAiGenerateError(error);
    }
  }

  private onAiGenerateError(error: any) {
    const code = getAiErrorCode(error);
    if (code) {
      console.error(
        "[AiGenerate] backend error:",
        code,
        error?.response?.data?.message,
      );
    } else {
      this.layoutEH.handleError(error);
    }
    this.layoutDS.toastService.error({
      title: _t("toast#ai_error_title"),
      text: _t(code ? `toast#ai_error_${code}` : "toast#ai_error_generic"),
      timer: _c("toastTimer"),
    });
  }

  private async requestAiPayloads(
    annotationPayload: any,
    prompt: string,
    annotationType: AiAnnotationType,
  ): Promise<any[]> {
    const prepared = prepareAiRequest(annotationPayload, prompt, annotationType);
    if (!prepared) {
      return [];
    }
    const { toolCalls, contiguousCalls } = await firstValueFrom(
      this.layoutDS.aiService.annotate(prepared.request),
    );
    return processLLMResponse(
      toolCalls,
      contiguousCalls,
      prepared.chunkMap,
      annotationPayload,
      annotationType,
    );
  }

  private async renderAiPreviews(aiPayloads: any[]): Promise<void> {
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
      this.layoutDS.annotationService.add(previewAnnotation);
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
    if (this.aiPreviewPayloads.length > 0) {
      for (let i = 0; i < this.aiPreviewPayloads.length; i++) {
        const previewId = `${AI_PREVIEW_ID_PREFIX}${i}`;
        this.layoutDS.annotationService.removeCached(previewId);
      }
    }
    this.aiPreviewPayloads = [];
    this.layoutEH.appEvent$.next({
      type: AppEvent.AiPreviewClear,
    });
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
}
