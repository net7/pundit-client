import { AiAnnotateRequest, AiAnnotationType } from "src/communication";
import { buildChunkProjection } from "./annotation-range-utils";
import { restoreRangeFromPayload } from "./annotation-range-restore";

export type PreparedAiRequest = {
  request: AiAnnotateRequest;
  chunkMap: Map<string, Text>;
};

/**
 * Builds the AI annotate request from the DOM range of the pending annotation.
 * Returns null when the range cannot be restored or contains no text.
 */
export function prepareAiRequest(
  annotationPayload: any,
  prompt: string,
  annotationType: AiAnnotationType,
): PreparedAiRequest | null {
  const range = restoreRangeFromPayload(annotationPayload);
  if (!range) {
    return null;
  }

  const { chunks, chunkMap } = buildChunkProjection(range);
  const filteredChunks = chunks.filter(
    (c) => typeof c.text === "string" && c.text.trim().length > 0,
  );
  if (filteredChunks.length === 0) {
    return null;
  }

  return {
    request: {
      chunks: filteredChunks,
      prompt,
      annotation_type: annotationType,
      selected_text:
        range.toString() || annotationPayload?.subject?.selected?.text || "",
    },
    chunkMap,
  };
}
