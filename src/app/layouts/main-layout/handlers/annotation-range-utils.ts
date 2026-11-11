import { wholeTextNodesInRange } from "@net7/annotator";
import { AiAnnotateSegment } from "src/communication";

/**
 * The segments of an AI request: one per text node inside the range, in
 * reading order, the boundary nodes split at the range's start and end.
 * Whitespace-only nodes are kept and texts are not trimmed, so the segments
 * joined are exactly the selection (the server computes offsets on them);
 * only empty nodes are skipped. The map gives the node of each segment id.
 */
function buildSegmentProjection(range: Range): {
  segments: AiAnnotateSegment[];
  segmentMap: Map<string, Text>;
} {
  const segments: AiAnnotateSegment[] = [];
  const segmentMap = new Map<string, Text>();
  let i = 0;
  wholeTextNodesInRange(range).forEach((node) => {
    const text = node.textContent ?? "";
    if (text === "") return;
    const id = `c${++i}`;
    segments.push({ id, text });
    segmentMap.set(id, node);
  });
  return { segments, segmentMap };
}

function getXPathForNode(node: Node): string {
  let current: Node | null =
    node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  const parts: string[] = [];
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const el = current as Element;
    let index = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${el.tagName.toLowerCase()}[${index}]`);
    current = el.parentElement;
    if (current === document.body) break;
  }
  return "/" + parts.join("/");
}

function getTextOffsetInBody(node: Node): number {
  let offset = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const current = walker.currentNode as Text;
    if (current === node) break;
    offset += current.textContent?.length ?? 0;
  }
  return offset;
}

function serializeRangeToSelector(range: Range): any {
  const startXPath = getXPathForNode(range.startContainer);
  const endXPath = getXPathForNode(range.endContainer);
  const text = range.toString();
  const nodeOffset = getTextOffsetInBody(
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer
      : range.startContainer.firstChild!,
  );
  const start = nodeOffset + range.startOffset;
  const end = start + text.length;
  const bodyText = document.body.textContent ?? "";
  const prefix =
    start > 0 ? bodyText.slice(Math.max(0, start - 20), start) : "";
  const suffix = end > 0 ? bodyText.slice(end, end + 20) : "";

  return {
    text,
    rangeSelector: {
      startContainer: startXPath,
      endContainer: endXPath,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    },
    textPositionSelector: { start, end },
    textQuoteSelector: { exact: text, prefix, suffix },
  };
}

export {
  buildSegmentProjection,
  getXPathForNode,
  getTextOffsetInBody,
  serializeRangeToSelector,
};
