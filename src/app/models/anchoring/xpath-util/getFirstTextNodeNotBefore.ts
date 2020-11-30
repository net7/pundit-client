/**
 * Determine the first text node in or after the given node.
 */
export function getFirstTextNodeNotBefore(node) {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return node; // We have found our text node.
    case Node.ELEMENT_NODE:
      // This is an element, we need to dig in
      if (node.firstChild) {
        // Does it have children at all?
        const result = getFirstTextNodeNotBefore(node.firstChild);
        if (result) {
          return result;
        }
      }
      break;
    default:
      break;
  }
  // Could not find a text node in current node, go forward
  const next = node.nextSibling;
  if (next) {
    // eslint-disable-next-line no-unused-vars
    return getFirstTextNodeNotBefore(next);
  }
  return null;
}
