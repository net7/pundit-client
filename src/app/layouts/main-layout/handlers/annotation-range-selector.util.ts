import { buildChunkProjection } from "./annotation-range-utils";
import { restoreRangeFromPayload } from "./annotation-range-restore";
import { processLLMResponse } from "./annotation-llm-processor";

export default async function mapChunks(
  annotationPayload: any,
  aiRequest: string,
): Promise<any[]> {
  const range = restoreRangeFromPayload(annotationPayload);
  if (!range) {
    console.warn("[mapChunks] Range non trovato nel DOM");
    return [];
  }

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
    return [];
  }

  const response = await fetch(`https://app.thepund.test/ai/annotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
    body: JSON.stringify({ chunks: filteredChunks, prompt: aiRequest }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[mapChunks] errore backend:", response.status, errorText);
    return [];
  }

  const respText = await response.text();
  let data: any;
  try {
    data = respText ? JSON.parse(respText) : {};
  } catch {
    console.error("[mapChunks] backend returned non-JSON response:", respText);
    return [];
  }

  const raw = data.result ?? "[]";
  let toolCalls: {
    chunkId: string;
    quote: string;
    words_counter: number;
    annotation_type?: string;
    comment?: string;
    tags?: string[];
  }[];

  try {
    toolCalls = Array.isArray(raw) ? raw : JSON.parse(raw);
    console.warn("[mapChunks] risposta LLM parsata:", toolCalls);
  } catch (error) {
    console.warn("[mapChunks] risposta backend non parsabile:", raw, error);
    return [];
  }

  console.warn("[mapChunks] Ricevuti elementi dal backend:", toolCalls.length);

  const newPayloads = await processLLMResponse(
    toolCalls,
    chunkMap,
    annotationPayload,
  );

  console.warn(
    "[mapChunks] COMPLETATO - Ritornando",
    newPayloads.length,
    "payload(s)",
  );
  return newPayloads;
}
