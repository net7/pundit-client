function toTextNode(node: Node): Node {
  if (node.nodeType === Node.TEXT_NODE) return node;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const firstText = walker.nextNode();
  return firstText ?? node;
}

function buildChunkProjection(range: Range): {
  chunks: { id: string; text: string }[];
  chunkMap: Map<string, Text>;
} {
  const chunks: { id: string; text: string }[] = [];
  const chunkMap = new Map<string, Text>();
  const root =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? (range.commonAncestorContainer.parentNode as Element)
      : (range.commonAncestorContainer as Element);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  let i = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent ?? "";
    if (text.length === 0) continue;
    const id = `c${++i}`;
    chunks.push({ id, text });
    chunkMap.set(id, node);
  }

  return { chunks, chunkMap };
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
  toTextNode,
  buildChunkProjection,
  getXPathForNode,
  getTextOffsetInBody,
  serializeRangeToSelector,
};
