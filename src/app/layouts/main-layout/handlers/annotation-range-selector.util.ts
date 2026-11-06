import { anchor } from "@net7/annotator";
import { AiAnnotateRequest, AiAnnotationType } from "src/communication";
import { getAnnotationSelectors } from "src/app/models/annotation/annotation-selectors";
import { buildChunkProjection } from "./annotation-range-utils";

export type PreparedAiRequest = {
  request: AiAnnotateRequest;
  chunkMap: Map<string, Text>;
};

/** The selection of the annotation, anchored as highlights are; null when not found. */
async function anchorSelection(annotationPayload: any): Promise<Range | null> {
  const selected = annotationPayload?.subject?.selected;
  if (!selected) {
    return null;
  }
  try {
    const { range } = await anchor(document.body, getAnnotationSelectors(selected));
    return range;
  } catch {
    return null;
  }
}

/**
 * Builds the AI annotate request from the selection of the pending annotation:
 * the chunks hold exactly the selected text.
 * Returns null when the selection cannot be anchored or contains no text.
 */
export async function prepareAiRequest(
  annotationPayload: any,
  prompt: string,
  annotationType: AiAnnotationType,
): Promise<PreparedAiRequest | null> {
  const range = await anchorSelection(annotationPayload);
  if (!range) {
    return null;
  }
  // read before the projection splits the boundary nodes
  const selectedText = range.toString();

  const { chunks, chunkMap } = buildChunkProjection(range);
  if (chunks.length === 0) {
    return null;
  }

  return {
    request: {
      chunks,
      prompt,
      annotation_type: annotationType,
      selected_text: selectedText || annotationPayload?.subject?.selected?.text || "",
    },
    chunkMap,
  };
}
