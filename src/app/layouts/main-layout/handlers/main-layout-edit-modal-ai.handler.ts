import { _t } from "@net7/core";
import { cloneDeep } from "lodash";
import { Observable, firstValueFrom, from } from "rxjs";
import { AppEvent, MainLayoutEvent, getEventType } from "src/app/event-types";
import { _c } from "src/app/models/config";
import { ToastInstance } from "src/app/services/toast.service";
import { AnalyticsModel } from "src/common/models";
import { AiAnnotateErrorCode, AiAnnotationType } from "src/communication";
import { MainLayoutDS } from "../main-layout.ds";
import { MainLayoutEH } from "../main-layout.eh";

import { preparePageAiRequest, prepareAiRequest } from "./annotation-range-selector.util";
import { processLLMResponse, processPageAiResponse } from "./annotation-llm-processor";
import { getAiSettingsToastParams } from "./ai-settings-toast.util";
import {
  AI_ERROR_TOAST_DELAY,
  AI_ONTOLOGY_ERROR_CODES,
  AI_SETTINGS_ERROR_CODES,
  getAiErrorCode,
} from "./ai-error-codes.util";
import { getOntologiesToastParams } from "./ontologies-warning-toast.util";
import { EditModalPayloadBuilder } from "./edit-modal-payload.builder";
import { isValidAnnotationPayload } from "./edit-modal-validation";
import { getAnnotationCreatedAnalytics } from "./edit-modal-analytics";
import { aiPreviewState$ } from "src/app/components/edit-modal/edit-modal";
import { AI_PREVIEW_ID_PREFIX, withoutPreviewTriple } from "src/app/models/ai-preview";

const AI_ANNOTATION_TYPES: AiAnnotationType[] = [
  "highlight",
  "comment",
  "tags",
  "semantic_annotation",
];

const toAiAnnotationType = (value?: string): AiAnnotationType =>
  AI_ANNOTATION_TYPES.find((type) => type === value) ?? "highlight";

export class MainLayoutEditModalAiHandler {
  /** Payloads of the previews shown, by preview id, in generation order. */
  private aiPreviews = new Map<string, any>();

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

    // highlight first: the request then works on the text nodes the highlight split
    await this.drawPendingHighlight(pendingPayload);

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
        aiPreviewState$.next(false);
        // the working toast stays until this one shows (after `timer`): no empty gap
        this.layoutDS.toastService.info({
          title: _t("toast#ai_no_results_title"),
          text: _t("toast#ai_no_results_text"),
          timer: _c("toastTimer"),
          onLoad: () => workingToast.close(),
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
      aiPreviewState$.next(false);
      this.onAiGenerateError(error, workingToast);
    }
  }

  private onAiGenerateError(error: any, workingToast: ToastInstance) {
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
      autoCloseDelay: AI_ERROR_TOAST_DELAY,
      // the working toast stays until this one shows (after `timer`): no empty gap
      onLoad: () => workingToast.close(),
      ...this.getAiErrorActionParams(code),
    });
  }

  /** The button that leads where the user fixes the error, if any. */
  private getAiErrorActionParams(code?: AiAnnotateErrorCode) {
    if (code && AI_SETTINGS_ERROR_CODES.includes(code)) {
      return getAiSettingsToastParams();
    }
    if (code && AI_ONTOLOGY_ERROR_CODES.includes(code)) {
      return getOntologiesToastParams(this.layoutDS.ontologyService);
    }
    return {};
  }

  /** The highlight of the pending selection; a page annotation has none. */
  private async drawPendingHighlight(pendingPayload: any): Promise<void> {
    if (!pendingPayload.subject?.selected) {
      return;
    }
    const pendingAnnotation =
      this.layoutDS.annotationService.getAnnotationFromPayload(
        this.layoutDS.pendingAnnotationId,
        pendingPayload,
      );
    await this.layoutDS.anchorService.add(pendingAnnotation);
  }

  /** Preview payloads: on the selection when there is one, on the page otherwise. */
  private requestAiPayloads(
    annotationPayload: any,
    prompt: string,
    annotationType: AiAnnotationType,
  ): Promise<any[]> {
    return annotationPayload.subject?.selected
      ? this.requestSelectionAiPayloads(annotationPayload, prompt, annotationType)
      : this.requestPageAiPayloads(annotationPayload, prompt, annotationType);
  }

  private async requestSelectionAiPayloads(
    annotationPayload: any,
    prompt: string,
    annotationType: AiAnnotationType,
  ): Promise<any[]> {
    const prepared = await prepareAiRequest(annotationPayload, prompt, annotationType);
    if (!prepared) {
      return [];
    }
    const annotations = await firstValueFrom(
      this.layoutDS.aiService.annotate(prepared.request),
    );
    return processLLMResponse(
      annotations,
      prepared.segmentMap,
      annotationPayload,
      annotationType,
    );
  }

  /** Page proposals of a request on the whole page: one page annotation each. */
  private async requestPageAiPayloads(
    annotationPayload: any,
    prompt: string,
    annotationType: AiAnnotationType,
  ): Promise<any[]> {
    const request = preparePageAiRequest(prompt, annotationType);
    if (!request) {
      return [];
    }
    const annotations = await firstValueFrom(
      this.layoutDS.aiService.annotate(request),
    );
    return processPageAiResponse(annotations, annotationPayload, annotationType);
  }

  /**
   * Shows the previews: a highlight and a sidebar card each; a page proposal
   * has no selection, so only its card (in the page annotations list).
   */
  private async renderAiPreviews(aiPayloads: any[]): Promise<void> {
    this.layoutDS.removePendingAnnotation();

    for (let i = 0; i < aiPayloads.length; i++) {
      const aiPayload = aiPayloads[i];
      const previewId = `${AI_PREVIEW_ID_PREFIX}${i}`;
      this.aiPreviews.set(previewId, aiPayload);
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
    if (!this.aiPreviews.size) {
      return;
    }

    const workingToast = this.layoutDS.toastService.working();
    const payloadsToSave = Array.from(this.aiPreviews.values());

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

  removeAiPreviews() {
    this.layoutDS.anchorService.removeByPrefix(AI_PREVIEW_ID_PREFIX);
    this.aiPreviews.forEach((_payload, previewId) => {
      this.layoutDS.annotationService.removeCached(previewId);
    });
    this.aiPreviews.clear();
    this.layoutEH.appEvent$.next({
      type: AppEvent.AiPreviewClear,
    });
  }

  /**
   * Discard one preview: its highlight, its sidebar card and its payload.
   * "Save all" is disabled when none is left.
   */
  discardAiPreview(previewId: string) {
    if (!this.aiPreviews.has(previewId)) {
      return;
    }
    this.layoutDS.anchorService.remove(previewId);
    this.layoutDS.annotationService.removeCached(previewId);
    this.aiPreviews.delete(previewId);
    if (!this.aiPreviews.size) {
      aiPreviewState$.next(false);
    }
    // refreshes the sidebar list
    this.layoutEH.appEvent$.next({
      type: AppEvent.AiPreviewClear,
    });
  }

  /**
   * Discard one triple of a semantic preview: its card and the payload saved by
   * "Save all" keep only the other triples. The last triple is never removed
   * alone: the whole preview is discarded instead (card discard button).
   */
  discardAiPreviewTriple(previewId: string, index: number) {
    const nextPayload = withoutPreviewTriple(this.aiPreviews.get(previewId), index);
    if (!nextPayload) return;
    this.aiPreviews.set(previewId, nextPayload);
    const { annotationService } = this.layoutDS;
    annotationService.add(annotationService.getAnnotationFromPayload(previewId, nextPayload));
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
