import { anchor } from "@net7/annotator";
import { AiAnnotateRequest, AiAnnotationType } from "src/communication";
import { getAnnotationSelectors } from "src/app/models/annotation/annotation-selectors";
import { buildSegmentProjection } from "./annotation-range-utils";

export type PreparedAiRequest = {
  request: AiAnnotateRequest;
  segmentMap: Map<string, Text>;
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
 * the segments, joined, are exactly the selected text.
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

  const { segments, segmentMap } = buildSegmentProjection(range);
  if (segments.length === 0) {
    return null;
  }

  return {
    request: {
      segments,
      prompt,
      annotation_type: annotationType,
    },
    segmentMap,
  };
}
