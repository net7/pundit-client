import { toTextNode } from "./annotation-range-utils";

function safeOffset(offset: any, textLength: number): number {
  return Math.min(
    typeof offset === "number" ? offset : 0,
    Math.max(0, textLength),
  );
}

function evaluateXPath(xpath: string): Node | null {
  const relative = xpath.startsWith("/") ? xpath.slice(1) : xpath;
  return document.evaluate(
    relative,
    document.body,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
}

function restoreRangeFromXPath(selected: any): Range | null {
  const { startContainer, endContainer, startOffset, endOffset } =
    selected.rangeSelector ?? {};
  if (!startContainer || !endContainer) return null;
  try {
    const startNode = evaluateXPath(startContainer);
    const endNode = evaluateXPath(endContainer);
    if (!startNode || !endNode) return null;
    const startText = toTextNode(startNode).textContent ?? "";
    const endText = toTextNode(endNode).textContent ?? "";
    const range = document.createRange();
    range.setStart(
      toTextNode(startNode),
      safeOffset(startOffset, startText.length),
    );
    range.setEnd(toTextNode(endNode), safeOffset(endOffset, endText.length));
    return range;
  } catch (e) {
    console.warn("[restoreRange] xpath fallito, provo textQuote", e);
    return null;
  }
}

function matchTextInNode(
  node: Text,
  exact: string,
  prefix?: string,
): Range | null {
  const textContent = node.textContent ?? "";
  const idx = textContent.indexOf(exact);
  if (idx === -1) return null;
  if (prefix && !textContent.substring(0, idx).endsWith(prefix.trim()))
    return null;
  const safeEnd = Math.min(idx + exact.length, Math.max(0, textContent.length));
  const range = document.createRange();
  range.setStart(node, idx);
  range.setEnd(node, safeEnd);
  return range;
}

function restoreRangeFromTextQuote(selected: any): Range | null {
  const { exact, prefix } = selected.textQuoteSelector ?? {};
  if (!exact) return null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const result = matchTextInNode(node, exact, prefix);
    if (result) return result;
  }
  return null;
}

function restoreRangeFromPayload(annotationPayload: any): Range | null {
  const selected = annotationPayload?.subject?.selected;
  if (!selected) return null;
  return restoreRangeFromXPath(selected) ?? restoreRangeFromTextQuote(selected);
}

function positionsSameWords(quote: string, subQuote: string): number[] {
  const secureSubQuote = subQuote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${secureSubQuote}\\b`, "gi");
  return [...quote.matchAll(regex)].map((match) => match.index);
}

export { restoreRangeFromPayload, positionsSameWords };
