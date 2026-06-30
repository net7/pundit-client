/* eslint-disable max-lines */
/* eslint-disable complexity */
import { _t } from "@net7/core";
import { SemanticTripleType } from "@pundit/communication";
import { cloneDeep } from "lodash";
import { EMPTY, Observable, from } from "rxjs";
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
      // toast "working..."
      workingToast = this.layoutDS.toastService.working();
    }
    this.onEditModalSave(payload)
      .pipe(
        catchError((e) => {
          this.layoutEH.handleError(e);
          // toast
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
        // clear previous annotation payload
        this.layoutDS.state.annotation.pendingPayload = null;
        this.layoutDS.state.annotation.updatePayload = null;

        if (data.isUpdate) {
          // signal
          this.layoutEH.appEvent$.next({
            type: AppEvent.CommentUpdate,
            payload: data.requestPayload,
          });
          // close the edit modal — the create flow closes it via onAnnotationCreated;
          // the update flow must emit the same close signal (EditModalEH listens to
          // MainLayoutEvent.AnnotationCreated to run closeModal()).
          this.layoutEH.emitOuter(
            getEventType(MainLayoutEvent.AnnotationCreated),
          );
        } else {
          this.onAnnotationCreated(data, workingToast);
        }
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
        map((updateRequestPayload) => ({
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
      switchMap((pendingRequestPayload) =>
        this.layoutDS.saveAnnotation(pendingRequestPayload),
      ),
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
  ) {
    const notebook = formState?.notebook?.value || null;
    const comment =
      typeof formState?.comment?.value === "string"
        ? formState?.comment?.value.trim()
        : null;
    const tags = formState?.tags?.value || null;
    const semantic = formState?.semantic?.value || null;
    const aiRequest =
      typeof formState?.aiRequest?.value === "string"
        ? formState?.aiRequest?.value.trim()
        : null;

    // check notebook value
    if (notebook) {
      annotationPayload.notebookId = notebook;
    }
    // check comment value
    this.applyCommentPayload(annotationPayload, comment);
    // check tags value
    if (Array.isArray(tags)) {
      annotationPayload.tags = tags.length ? tags : undefined;
    }
    // check semantic value
    this.applySemanticPayload(annotationPayload, semantic);
    // check Ai Request value
    if (aiRequest != null) {
      console.log(annotationPayload, aiRequest);
      await this.mapChunks(annotationPayload, aiRequest);
    }
    return annotationPayload;
  }

  private applyCommentPayload(annotationPayload: any, comment: string | null) {
    if (comment) {
      annotationPayload.type = "Commenting";
      annotationPayload.content = { comment };
    } else {
      annotationPayload.type = "Highlighting";
      annotationPayload.content = undefined;
    }
  }

  private applySemanticPayload(annotationPayload: any, semantic: any) {
    if (!Array.isArray(semantic)) {
      return;
    }
    annotationPayload.type = semantic.length ? "Linking" : "Highlighting";
    annotationPayload.content = semantic.length
      ? semantic.map((row) => this.getSemanticContentRow(row))
      : undefined;
  }

  private getSemanticContentRow(row: any) {
    const { predicate, object, objectType } = row;
    // old semantic annotation check
    if (object?.rdfTypes?.length) {
      return row;
    }
    const objectPayload = this.getObjectPayload(object, objectType);
    return {
      predicate: {
        label: predicate.label,
        uri: predicate.uri,
      },
      ...objectPayload,
    };
  }

  private getObjectPayload = (object: any, objectType: string) => {
    if (objectType === "literal") {
      return { objectType, object: { text: object.label } };
    }
    if (objectType === "uri") {
      return {
        objectType,
        object: {
          uri: object.label,
          source: "free-text",
        },
      };
    }
    return {};
  };

  private isUpdate = () => !!this.layoutDS.state.annotation.updatePayload;

  // al momento metterò qui la funzione per provare la chiave

  private toTextNode(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) return node;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const firstText = walker.nextNode();
    return firstText ?? node;
  }

  private buildChunkProjection(range: Range): {
    chunks: { id: string; text: string }[];
    chunkMap: Map<string, Text>;
  } {
    const chunks: { id: string; text: string }[] = [];
    const chunkMap = new Map<string, Text>();
    // la funzione commonAncestorContainer mi permette di prendere il sottoalbero che contiene il mio range, dentro il quale quindi applicherò la funzione
    // createTreeWalker per scorrere tutti i nodi che contengono del testo
    const root =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? (range.commonAncestorContainer.parentNode as Element)
        : (range.commonAncestorContainer as Element);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });

    let i = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.textContent?.trim();
      if (!text) continue;

      const id = `c${++i}`;
      chunks.push({ id, text });
      chunkMap.set(id, node);
    }

    return { chunks, chunkMap };
  }

  private async mapChunks(
    annotationPayload: any,
    aiRequest: string,
  ): Promise<void> {
    const range = this.restoreRangeFromPayload(annotationPayload);
    if (!range) {
      console.warn("[mapChunks] Range non trovato nel DOM");
      return;
    }

    const { chunks, chunkMap } = this.buildChunkProjection(range);
    //console.log("[mapChunks] chunks per LLM:", chunks);
    //console.log("[mapChunks] chunkMap privata:", chunkMap);
    //console.log("[mapChunks] prompt:", aiRequest);

    const response = await fetch(
      "https://llm.graphia-ssh.eu/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer sk-Q4a0hn-WBld_ynRRWfHqug`, // verrà dalla config utente
        },
        body: JSON.stringify({
          model: "DeepSeek-V3.1-vLLM",
          messages: [
            {
              role: "system",
              content: `Sei un assistente che analizza testo.
  Ricevi una lista di chunk di testo con id e testo.
  Devi rispondere SOLO con un JSON array di oggetti con questa forma:
  [{ "chunkId": "c1", "quote": "la parte esatta da evidenziare" }]
  Usa solo testo che esiste letteralmente nei chunk forniti.`,
            },
            {
              role: "user",
              content: `Chunks di testo:\n${JSON.stringify(chunks, null, 2)}\n\nPrompt utente: ${aiRequest}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[mapChunks] errore LLM:", response.status, errorText);
      return;
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "[]";

    let toolCalls: { chunkId: string; quote: string }[];
    try {
      toolCalls = JSON.parse(raw);
    } catch {
      console.warn("[mapChunks] risposta LLM non parsabile:", raw);
      return;
    }

    //console.log("[mapChunks] risposta LLM:", toolCalls);

    for (const call of toolCalls) {
      const node = chunkMap.get(call.chunkId);
      if (!node) {
        console.warn("[mapChunks] chunkId non trovato:", call.chunkId);
        continue;
      }

      const startOffset = node.textContent?.indexOf(call.quote) ?? -1;
      if (startOffset === -1) {
        console.warn("[mapChunks] quote non trovata nel chunk:", call.quote);
        continue;
      }

      const finalRange = document.createRange();
      finalRange.setStart(node, startOffset);
      finalRange.setEnd(node, startOffset + call.quote.length);

      //console.log("[mapChunks] Range finale costruito:", finalRange.toString());
      //  qui il prossimo step sarà passare finalRange all' Annotator dopo però averlo ricostruito correttamente
    }
  }

  // Questa funzione ricostruisce il Range come oggetto dal DOM usando startContainer xpath del rangeSelector
  private restoreRangeFromPayload(annotationPayload: any): Range | null {
    const selected = annotationPayload?.subject?.selected;
    if (!selected) return null;

    const { startContainer, endContainer, startOffset, endOffset } =
      selected.rangeSelector ?? {};

    if (startContainer && endContainer) {
      try {
        const toRelative = (xpath: string) =>
          xpath.startsWith("/") ? xpath.slice(1) : xpath;

        const startNode = document.evaluate(
          toRelative(startContainer),
          document.body,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue;

        const endNode = document.evaluate(
          toRelative(endContainer),
          document.body,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue;

        //console.log("[restoreRange] startNode:", startNode);
        //console.log("[restoreRange] endNode:", endNode);

        if (startNode && endNode) {
          const range = document.createRange();
          range.setStart(this.toTextNode(startNode), startOffset ?? 0);
          range.setEnd(this.toTextNode(endNode), endOffset ?? 0);
          return range;
        }
      } catch (e) {
        console.warn("[restoreRange] xpath fallito, provo textQuote", e);
      }
    }

    // fallback textQuoteSelector
    const { exact, prefix } = selected.textQuoteSelector ?? {};
    if (!exact) return null;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const idx = node.textContent?.indexOf(exact) ?? -1;
      if (idx === -1) continue;
      if (
        prefix &&
        !node.textContent?.substring(0, idx).endsWith(prefix.trim())
      )
        continue;

      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + exact.length);
      return range;
    }

    return null;
  }
}
