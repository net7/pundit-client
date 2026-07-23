import { toTextNode } from "./annotation-range-utils";

function restoreRangeFromXPath(selected: any): Range | null {
  const { startContainer, endContainer, startOffset, endOffset } =
    selected.rangeSelector ?? {};
  if (!startContainer || !endContainer) return null;
  try {
    const toRelative = (xpath: string) =>
      xpath.startsWith("/") ? xpath.slice(1) : xpath;
    const startNode = document.evaluate(
      toRelative(startContainer),
      document.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
    const endNode = document.evaluate(
      toRelative(endContainer),
      document.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(toTextNode(startNode), startOffset ?? 0);
    range.setEnd(toTextNode(endNode), endOffset ?? 0);
    return range;
  } catch (e) {
    console.warn("[restoreRange] xpath fallito, provo textQuote", e);
    return null;
  }
}

function restoreRangeFromTextQuote(selected: any): Range | null {
  const { exact, prefix } = selected.textQuoteSelector ?? {};
  if (!exact) return null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const idx = node.textContent?.indexOf(exact) ?? -1;
    if (idx === -1) continue;
    if (prefix && !node.textContent?.substring(0, idx).endsWith(prefix.trim()))
      continue;
    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + exact.length);
    return range;
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
