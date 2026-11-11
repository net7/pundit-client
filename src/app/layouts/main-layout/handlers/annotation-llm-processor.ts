import {
  AiAnnotation,
  AiAnnotationTarget,
  AiAnnotationType,
} from "src/communication";
import { addPayloadForRange } from "./annotation-llm-helpers.util";

type SegmentSpan = {
  id: string;
  node: Text;
  /** Offset of the segment in the joined text of all segments. */
  offset: number;
  length: number;
};

/** A Range from the offsets (UTF-16, as received); null when they are out of bounds. */
function rangeFromOffsets(
  startNode: Text,
  start: number,
  endNode: Text,
  end: number,
): Range | null {
  try {
    const range = document.createRange();
    range.setStart(startNode, start);
    range.setEnd(endNode, end);
    return range;
  } catch {
    return null;
  }
}

/** The segments in reading order (Map order) with their offset in the joined text. */
function joinSegments(segmentMap: Map<string, Text>): { spans: SegmentSpan[]; joined: string } {
  const spans: SegmentSpan[] = [];
  let joined = "";
  segmentMap.forEach((node, id) => {
    const text = node.textContent ?? "";
    spans.push({ id, node, offset: joined.length, length: text.length });
    joined += text;
  });
  return { spans, joined };
}

/** First and last segment of the target; null when unknown or out of order. */
function getTargetSpans(
  target: AiAnnotationTarget,
  spans: SegmentSpan[],
): { startSpan: SegmentSpan; endSpan: SegmentSpan } | null {
  const first = spans.findIndex(({ id }) => id === target.segment);
  const last = target.end_segment
    ? spans.findIndex(({ id }) => id === target.end_segment)
    : first;
  if (first === -1 || last < first) {
    return null;
  }
  return { startSpan: spans[first], endSpan: spans[last] };
}

/** How many of prefix and suffix match the text around the occurrence. */
function contextScore(
  joined: string,
  index: number,
  target: AiAnnotationTarget,
): number {
  const { exact, prefix, suffix } = target;
  const end = index + exact.length;
  const prefixMatch =
    !!prefix && index >= prefix.length && joined.slice(index - prefix.length, index) === prefix;
  const suffixMatch = !!suffix && joined.slice(end, end + suffix.length) === suffix;
  return Number(prefixMatch) + Number(suffixMatch);
}

/**
 * Anchors `exact` with its context in the segments from `segment` to
 * `end_segment`: among the occurrences starting in the first segment and
 * ending in the last, the one whose prefix and suffix match the text around it
 * (read on the whole selection), the first one on equal match.
 */
function anchorQuote(
  target: AiAnnotationTarget,
  segmentMap: Map<string, Text>,
): Range | null {
  const { exact } = target;
  const { spans, joined } = joinSegments(segmentMap);
  const targetSpans = exact ? getTargetSpans(target, spans) : null;
  if (!targetSpans) {
    return null;
  }
  const { startSpan, endSpan } = targetSpans;
  const endsInLastSegment = (end: number) =>
    end > endSpan.offset && end <= endSpan.offset + endSpan.length;

  let best: { index: number; score: number } | null = null;
  let index = joined.indexOf(exact, startSpan.offset);
  while (index !== -1 && index < startSpan.offset + startSpan.length) {
    if (endsInLastSegment(index + exact.length)) {
      const score = contextScore(joined, index, target);
      if (!best || score > best.score) {
        best = { index, score };
      }
    }
    index = joined.indexOf(exact, index + 1);
  }
  if (!best) {
    return null;
  }

  return rangeFromOffsets(
    startSpan.node,
    best.index - startSpan.offset,
    endSpan.node,
    best.index + exact.length - endSpan.offset,
  );
}

/** The nodes of the target's segments; null when unknown or no longer in the page. */
function getTargetNodes(
  target: AiAnnotationTarget,
  segmentMap: Map<string, Text>,
): { startNode: Text; endNode: Text } | null {
  const startNode = segmentMap.get(target.segment);
  const endNode = target.end_segment
    ? segmentMap.get(target.end_segment)
    : startNode;
  if (!startNode?.isConnected || !endNode?.isConnected) {
    return null;
  }
  return { startNode, endNode };
}

const hasText = (range: Range | null, text: string): range is Range =>
  !!range && range.toString() === text;

/**
 * The Range of an AI annotation: from its offsets when their text is `exact`,
 * otherwise anchored with `exact`, `prefix` and `suffix` (null offsets, or a
 * page changed meanwhile). Null when the segments are unknown or no longer in
 * the page, or when `exact` cannot be found.
 */
function locateTarget(
  target: AiAnnotationTarget,
  segmentMap: Map<string, Text>,
): Range | null {
  const nodes = getTargetNodes(target, segmentMap);
  if (!nodes) {
    return null;
  }
  const { start, end, exact } = target;
  if (typeof start === "number" && typeof end === "number") {
    const range = rangeFromOffsets(nodes.startNode, start, nodes.endNode, end);
    if (hasText(range, exact)) {
      return range;
    }
  }
  const range = anchorQuote(target, segmentMap);
  return hasText(range, exact) ? range : null;
}

/**
 * Preview payloads of the AI annotations, in the order received; the
 * annotations that cannot be placed or lack the content of their type are skipped.
 */
function processLLMResponse(
  annotations: AiAnnotation[],
  segmentMap: Map<string, Text>,
  annotationPayload: any,
  requestedType: AiAnnotationType,
): any[] {
  const payloads: any[] = [];
  for (const annotation of annotations) {
    try {
      const range = annotation?.target
        ? locateTarget(annotation.target, segmentMap)
        : null;
      if (!range) {
        continue;
      }
      const payload = addPayloadForRange(
        range,
        annotation,
        annotationPayload,
        requestedType,
      );
      if (payload) {
        payloads.push(payload);
      }
    } catch (error) {
      console.error("[processLLMResponse] AI annotation not placed:", {
        annotation,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return payloads;
}

export { processLLMResponse };
