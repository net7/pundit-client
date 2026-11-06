import { wholeTextNodesInRange } from "@net7/annotator";

/**
 * The chunks of an AI request: one per non-empty text node inside the range,
 * the boundary nodes split at the range's start and end, so the text sent is
 * exactly the selection. The map gives the node of each chunk id.
 */
function buildChunkProjection(range: Range): {
  chunks: { id: string; text: string }[];
  chunkMap: Map<string, Text>;
} {
  const chunks: { id: string; text: string }[] = [];
  const chunkMap = new Map<string, Text>();
  let i = 0;
  wholeTextNodesInRange(range).forEach((node) => {
    const text = node.textContent ?? "";
    if (text.trim().length === 0) return;
    const id = `c${++i}`;
    chunks.push({ id, text });
    chunkMap.set(id, node);
  });
  return { chunks, chunkMap };
}

/** Start positions of `subQuote` as a whole word (case-insensitive) in `quote`. */
function positionsSameWords(quote: string, subQuote: string): number[] {
  const secureSubQuote = subQuote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${secureSubQuote}\\b`, "gi");
  return [...quote.matchAll(regex)].map((match) => match.index);
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
  buildChunkProjection,
  positionsSameWords,
  getXPathForNode,
  getTextOffsetInBody,
  serializeRangeToSelector,
};
