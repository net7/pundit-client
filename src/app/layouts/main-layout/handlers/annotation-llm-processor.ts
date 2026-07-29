import { positionsSameWords } from "./annotation-range-restore";
import { mergeContiguousToolCalls } from "./annotation-llm-merge.util";
import { addPayloadForRange } from "./annotation-llm-helpers.util";

function findQuoteIndex(
  nodeText: string,
  quote: string,
): { index: number; length: number } {
  let index = nodeText.indexOf(quote);
  let effectiveQuote = quote;
  if (index === -1 && quote.trim()) {
    effectiveQuote = quote.trim();
    index = nodeText.indexOf(effectiveQuote);
  }
  return { index, length: effectiveQuote.length };
}

async function processToolCall(
  node: Text,
  quote: string,
  call: any,
  annotationPayload: any,
  newPayloads: any[],
  defaultAnnotationType?: string,
): Promise<void> {
  const nodeText = node.textContent ?? "";
  const wordCount = call.words_counter ?? 1;
  const annotationType = call.annotation_type || defaultAnnotationType;

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
        call.triple,
        node,
      );
    }
  } else {
    const match = findQuoteIndex(nodeText, quote);
    if (match.index === -1) {
      console.warn("[mapChunks] quote non trovata nel DOM reale:", {
        quote,
        chunkId: call.chunkId,
        nodeText: nodeText.substring(0, 100),
      });
      return;
    }
    addPayloadForRange(
      node,
      match.index,
      match.index + match.length,
      annotationPayload,
      newPayloads,
      annotationType,
      call.comment,
      call.tags,
      call.triple,
      node,
    );
  }
}

function getField(call: any, camel: string, snake: string): string {
  return String(call[camel] ?? call[snake] ?? "");
}

function extractQuoteBounds(
  call: any,
): {
  startChunkId: string;
  endChunkId: string;
  startQuote: string;
  endQuote: string;
} | null {
  const startChunkId = getField(call, "startChunkId", "start_chunk_id");
  const endChunkId = getField(call, "endChunkId", "end_chunk_id");
  const startQuote = getField(call, "startQuote", "start_quote");
  const endQuote = getField(call, "endQuote", "end_quote");

  if (startChunkId && endChunkId && startQuote && endQuote) {
    return { startChunkId, endChunkId, startQuote, endQuote };
  }
  return null;
}

function resolveMatchRange(
  startNode: Text,
  startQuote: string,
  endNode: Text,
  endQuote: string,
): { startIndex: number; endIndex: number } | null {
  const startMatch = findQuoteIndex(startNode.textContent ?? "", startQuote);
  if (startMatch.index === -1) {
    return null;
  }
  const endMatch = findQuoteIndex(endNode.textContent ?? "", endQuote);
  if (endMatch.index === -1) {
    return null;
  }
  return {
    startIndex: startMatch.index,
    endIndex: endMatch.index + endMatch.length,
  };
}

async function processContiguousToolCall(
  call: any,
  chunkMap: Map<string, Text>,
  annotationPayload: any,
  newPayloads: any[],
  defaultAnnotationType?: string,
): Promise<void> {
  const bounds = extractQuoteBounds(call);
  if (!bounds) {
    console.warn("[mapChunks] contiguous call mancante di id o quote:", call);
    return;
  }

  const startNode = chunkMap.get(bounds.startChunkId);
  const endNode = chunkMap.get(bounds.endChunkId);
  if (!startNode || !endNode) {
    console.warn("[mapChunks] chunkId non trovato:", bounds);
    return;
  }

  const range = resolveMatchRange(
    startNode,
    bounds.startQuote,
    endNode,
    bounds.endQuote,
  );
  if (!range) {
    console.warn("[mapChunks] quote non trovate nel DOM:", bounds);
    return;
  }

  const annotationType = call.annotation_type || defaultAnnotationType;
  addPayloadForRange(
    startNode,
    range.startIndex,
    range.endIndex,
    annotationPayload,
    newPayloads,
    annotationType,
    call.comment,
    call.tags,
    call.triple,
    endNode,
  );
}

async function executeSingleToolCalls(
  toolCalls: any[],
  chunkMap: Map<string, Text>,
  annotationPayload: any,
  newPayloads: any[],
  defaultAnnotationType?: string,
): Promise<void> {
  for (const call of toolCalls) {
    try {
      const node = chunkMap.get(call.chunkId);
      const quote = call.quote ?? "";
      if (!node || !quote) {
        console.warn("[mapChunks] chunkId o quote mancante:", call);
        continue;
      }
      await processToolCall(
        node,
        quote,
        call,
        annotationPayload,
        newPayloads,
        defaultAnnotationType,
      );
    } catch (error) {
      console.error(
        "[mapChunks] Errore durante l'elaborazione di un elemento:",
        {
          call,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }
}

async function executeContiguousToolCalls(
  contiguousCalls: any[],
  chunkMap: Map<string, Text>,
  annotationPayload: any,
  newPayloads: any[],
  defaultAnnotationType?: string,
): Promise<void> {
  for (const call of contiguousCalls) {
    try {
      await processContiguousToolCall(
        call,
        chunkMap,
        annotationPayload,
        newPayloads,
        defaultAnnotationType,
      );
    } catch (error) {
      console.error(
        "[mapChunks] Errore durante l'elaborazione di un elemento contiguo:",
        {
          call,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }
}

async function processLLMResponse(
  toolCalls: any[],
  contiguousCalls: any[],
  chunkMap: Map<string, Text>,
  annotationPayload: any,
  defaultAnnotationType?: string,
): Promise<any[]> {
  let singleCalls = toolCalls || [];
  let allContiguousCalls = Array.isArray(contiguousCalls)
    ? contiguousCalls
    : [];

  if (singleCalls.length > 0 && chunkMap) {
    const merged = mergeContiguousToolCalls(singleCalls, chunkMap);
    singleCalls = merged.singleCalls;
    allContiguousCalls = [...allContiguousCalls, ...merged.contiguousCalls];
    console.warn("[mapChunks] auto-merged single calls into contiguous:", {
      singleRemaining: singleCalls.length,
      contiguousTotal: allContiguousCalls.length,
    });
  }

  const newPayloads: any[] = [];
  await executeSingleToolCalls(
    singleCalls,
    chunkMap,
    annotationPayload,
    newPayloads,
    defaultAnnotationType,
  );
  await executeContiguousToolCalls(
    allContiguousCalls,
    chunkMap,
    annotationPayload,
    newPayloads,
    defaultAnnotationType,
  );

  return newPayloads;
}

export { processLLMResponse };
