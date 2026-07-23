import { cloneDeep } from "lodash";
import { serializeRangeToSelector } from "./annotation-range-utils";
import { positionsSameWords } from "./annotation-range-restore";

function applyAnnotationType(
  payload: any,
  annotationType?: string,
  commentText?: string,
  tags?: string[],
): void {
  if (annotationType === "Commenting" && commentText) {
    payload.type = "Commenting";
    payload.content = { comment: commentText };
  } else if (annotationType === "tag") {
    payload.type = "Highlighting";
    payload.content = undefined;
  } else if (annotationType === "semanticAnnotation") {
    payload.type = "Linking";
    payload.content = undefined;
  } else {
    payload.type = "Highlighting";
    payload.content = undefined;
  }
  payload.tags = tags && tags.length ? tags : undefined;
}

function addPayloadForRange(
  node: Text,
  startIndex: number,
  endIndex: number,
  annotationPayload: any,
  newPayloads: any[],
  annotationType?: string,
  commentText?: string,
  tags?: string[],
): void {
  const finalRange = document.createRange();
  finalRange.setStart(node, startIndex);
  finalRange.setEnd(node, endIndex);
  const selected = serializeRangeToSelector(finalRange);

  if (!annotationPayload) {
    console.error("[mapChunks] ERRORE: annotationPayload è undefined!");
    return;
  }

  const newPayload = cloneDeep(annotationPayload);
  newPayload.subject = { ...newPayload.subject, selected };
  applyAnnotationType(newPayload, annotationType, commentText, tags);
  newPayloads.push(newPayload);
}

async function processToolCall(
  node: Text,
  quote: string,
  call: any,
  annotationPayload: any,
  newPayloads: any[],
): Promise<void> {
  const nodeText = node.textContent ?? "";
  const wordCount = call.words_counter ?? 1;
  const annotationType = call.annotation_type;

  if (wordCount > 1) {
    const starterPositions = positionsSameWords(nodeText, quote);
    console.warn(starterPositions);
    if (starterPositions.length === 0) {
      console.warn("[mapChunks] quote non trovate nel DOM reale:", {
        quote,
        chunkId: call.chunkId,
        nodeText: nodeText.substring(0, 100),
      });
      return;
    }
    for (let i = 0; i < starterPositions.length; i++) {
      const startIndex = starterPositions[i];
      const endIndex = startIndex + quote.length;
      addPayloadForRange(
        node,
        startIndex,
        endIndex,
        annotationPayload,
        newPayloads,
        annotationType,
        call.comment,
        call.tags,
      );
    }
  } else {
    const startIndex = nodeText.indexOf(quote);
    if (startIndex === -1) {
      console.warn("[mapChunks] quote non trovata nel DOM reale:", {
        quote,
        chunkId: call.chunkId,
        nodeText: nodeText.substring(0, 100),
      });
      return;
    }
    const endIndex = startIndex + quote.length;
    addPayloadForRange(
      node,
      startIndex,
      endIndex,
      annotationPayload,
      newPayloads,
      annotationType,
      call.comment,
      call.tags,
    );
  }
}

async function processLLMResponse(
  toolCalls: any[],
  chunkMap: Map<string, Text>,
  annotationPayload: any,
): Promise<any[]> {
  const newPayloads: any[] = [];
  for (const call of toolCalls) {
    try {
      const node = chunkMap.get(call.chunkId);
      if (!node) {
        console.warn("[mapChunks] chunkId non trovato:", call.chunkId);
        continue;
      }
      const quote = call.quote ?? "";
      if (!quote) {
        console.warn("[mapChunks] quote mancante:", call);
        continue;
      }
      await processToolCall(node, quote, call, annotationPayload, newPayloads);
    } catch (error) {
      console.error(
        "[mapChunks] Errore durante l'elaborazione di un elemento:",
        {
          call,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      continue;
    }
  }
  return newPayloads;
}

export { processLLMResponse };
