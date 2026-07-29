import { buildChunkProjection } from "./annotation-range-utils";
import { restoreRangeFromPayload } from "./annotation-range-restore";
import { processLLMResponse } from "./annotation-llm-processor";

function prepareChunks(range: Range): { filteredChunks: any[]; chunkMap: Map<string, Text> } | null {
  const { chunks, chunkMap } = buildChunkProjection(range);

  const filteredChunks = chunks.filter(
    (c) => typeof c.text === "string" && c.text.trim().length > 0,
  );
  if (filteredChunks.length !== chunks.length) {
    console.warn("[mapChunks] removed empty chunks before send", {
      original: chunks.length,
      filtered: filteredChunks.length,
    });
  }
  if (filteredChunks.length === 0) {
    console.warn("[mapChunks] no valid chunks to send");
    return null;
  }

  return { filteredChunks, chunkMap };
}

function parseJsonArray(raw: any, label: string): any[] {
  try {
    const result = Array.isArray(raw) ? raw : JSON.parse(raw);
    console.warn(`[mapChunks] risposta LLM ${label} parsata:`, result);
    return result;
  } catch (error) {
    console.warn(
      `[mapChunks] risposta backend ${label} non parsabile:`,
      raw,
      error,
    );
    return [];
  }
}

async function fetchAiAnnotations(
  filteredChunks: any[],
  aiRequest: string,
  annotationType: string,
  selectedText: string,
): Promise<{ toolCalls: any[]; contiguousCalls: any[] } | null> {
  const response = await fetch(`https://app.thepund.test/ai/annotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
    body: JSON.stringify({
      chunks: filteredChunks,
      prompt: aiRequest,
      annotationType,
      annotation_type: annotationType,
      selected_text: selectedText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[mapChunks] errore backend:", response.status, errorText);
    return null;
  }

  const respText = await response.text();
  let data: any;
  try {
    data = respText ? JSON.parse(respText) : {};
  } catch {
    console.error("[mapChunks] backend returned non-JSON response:", respText);
    return null;
  }

  const toolCalls = parseJsonArray(data.result ?? "[]", "result");
  const contiguousCalls = parseJsonArray(
    data.contiguous_chunks ?? "[]",
    "contiguous_chunks",
  );

  return { toolCalls, contiguousCalls };
}

export default async function mapChunks(
  annotationPayload: any,
  aiRequest: string,
  annotationType: string = "highlight",
): Promise<any[]> {
  const range = restoreRangeFromPayload(annotationPayload);
  if (!range) {
    console.warn("[mapChunks] Range non trovato nel DOM");
    return [];
  }

  const prep = prepareChunks(range);
  if (!prep) {
    return [];
  }

  const selectedText =
    range.toString() || annotationPayload?.subject?.selected?.text || "";

  const aiResult = await fetchAiAnnotations(
    prep.filteredChunks,
    aiRequest,
    annotationType,
    selectedText,
  );
  if (!aiResult) {
    return [];
  }

  console.warn("[mapChunks] Ricevuti elementi dal backend:", {
    singleChunks: aiResult.toolCalls.length,
    contiguousChunks: aiResult.contiguousCalls.length,
  });

  const newPayloads = await processLLMResponse(
    aiResult.toolCalls,
    aiResult.contiguousCalls,
    prep.chunkMap,
    annotationPayload,
    annotationType,
  );

  console.warn(
    "[mapChunks] COMPLETATO - Ritornando",
    newPayloads.length,
    "payload(s)",
  );
  return newPayloads;
}
