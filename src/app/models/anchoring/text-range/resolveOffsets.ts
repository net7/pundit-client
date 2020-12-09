/**
 * Resolve one or more character offsets within an element to (text node, position)
 * pairs.
 *
 * @param {Element} element
 * @param {number[]} offsets - Offsets, which must be sorted in ascending order
 * @return {{ node: Text, offset: number }[]}
 */
export function resolveOffsets(element: HTMLElement, ...offsets: number[]) {
  let nextOffset = offsets.shift();
  const nodeIter = /** @type {Document} */ (element.ownerDocument).createNodeIterator(
    element,
    NodeFilter.SHOW_TEXT
  );
  const results = [];

  let currentNode = nodeIter.nextNode();
  let textNode;
  let length = 0;

  // Find the text node containing the `nextOffset`th character from the start
  // of `element`.
  while (nextOffset !== undefined && currentNode) {
    textNode = /** @type {Text} */ (currentNode);
    if (length + textNode.data.length > nextOffset) {
      results.push({ node: textNode, offset: nextOffset - length });
      nextOffset = offsets.shift();
    } else {
      currentNode = nodeIter.nextNode();
      length += textNode.data.length;
    }
  }

  // Boundary case.
  while (nextOffset !== undefined && textNode && length === nextOffset) {
    results.push({ node: textNode, offset: textNode.data.length });
    nextOffset = offsets.shift();
  }

  if (nextOffset !== undefined) {
    throw new RangeError('Offset exceeds text length');
  }

  return results;
}
