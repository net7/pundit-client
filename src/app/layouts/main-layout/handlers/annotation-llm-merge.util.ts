function getValidNodes(
  prevCall: any,
  nextCall: any,
  chunkMap: Map<string, Text>,
): { prevNode: Text; nextNode: Text } | null {
  const prevNode = chunkMap.get(prevCall.chunkId);
  const nextNode = chunkMap.get(nextCall.chunkId);
  if (!prevNode || !nextNode) return null;
  return { prevNode, nextNode };
}

function isBoundaryMatch(
  prevText: string,
  prevQuote: string,
  nextText: string,
  nextQuote: string,
): boolean {
  const prevMatch = prevQuote.trim() || prevQuote;
  const prevQuoteIdx = prevText.indexOf(prevMatch);
  if (
    prevQuoteIdx === -1 ||
    prevQuoteIdx + prevMatch.length < prevText.trimEnd().length
  ) {
    return false;
  }

  const nextMatch = nextQuote.trim() || nextQuote;
  const nextStartIndex = nextText.indexOf(nextMatch);
  if (
    nextStartIndex === -1 ||
    nextStartIndex > nextText.length - nextText.trimStart().length
  ) {
    return false;
  }

  return true;
}

export function canMergeCalls(
  prevCall: any,
  nextCall: any,
  endChunkIdx: number,
  chunkIdsOrder: string[],
  chunkMap: Map<string, Text>,
): boolean {
  const nextIdx = chunkIdsOrder.indexOf(nextCall.chunkId);
  if (nextIdx !== endChunkIdx + 1) return false;

  const prevType = (prevCall.annotation_type || "").toLowerCase();
  const nextType = (nextCall.annotation_type || "").toLowerCase();
  if (prevType !== nextType) return false;

  const nodes = getValidNodes(prevCall, nextCall, chunkMap);
  if (!nodes) return false;

  return isBoundaryMatch(
    nodes.prevNode.textContent ?? "",
    prevCall.quote ?? "",
    nodes.nextNode.textContent ?? "",
    nextCall.quote ?? "",
  );
}

export function createContiguousCall(startCall: any, endCall: any): any {
  return {
    startChunkId: startCall.chunkId,
    startQuote: startCall.quote,
    endChunkId: endCall.chunkId,
    endQuote: endCall.quote,
    annotation_type: startCall.annotation_type,
    comment: startCall.comment || endCall.comment,
    tags: [...(startCall.tags || []), ...(endCall.tags || [])],
    triple: startCall.triple || endCall.triple,
  };
}

export function mergeContiguousToolCalls(
  toolCalls: any[],
  chunkMap: Map<string, Text>,
): { singleCalls: any[]; contiguousCalls: any[] } {
  if (!toolCalls || toolCalls.length <= 1) {
    return { singleCalls: toolCalls || [], contiguousCalls: [] };
  }

  const chunkIdsOrder = Array.from(chunkMap.keys());
  const singleCalls: any[] = [];
  const contiguousCalls: any[] = [];

  let i = 0;
  while (i < toolCalls.length) {
    const current = toolCalls[i];
    const currentIdx = chunkIdsOrder.indexOf(current.chunkId);

    if (currentIdx === -1) {
      singleCalls.push(current);
      i++;
      continue;
    }

    let j = i;
    let endChunkIdx = currentIdx;

    while (
      j + 1 < toolCalls.length &&
      canMergeCalls(
        toolCalls[j],
        toolCalls[j + 1],
        endChunkIdx,
        chunkIdsOrder,
        chunkMap,
      )
    ) {
      j++;
      endChunkIdx = chunkIdsOrder.indexOf(toolCalls[j].chunkId);
    }

    if (j > i) {
      contiguousCalls.push(createContiguousCall(toolCalls[i], toolCalls[j]));
      i = j + 1;
    } else {
      singleCalls.push(current);
      i++;
    }
  }

  return { singleCalls, contiguousCalls };
}
