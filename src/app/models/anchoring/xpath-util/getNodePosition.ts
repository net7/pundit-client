/**
 * Get the index of the node as it appears in its parent's child list
 *
 * @param {Node} node
 */
export function getNodePosition(node) {
  let pos = 0;
  /** @type {Node|null} */
  let tmp = node;
  while (tmp) {
    if (tmp.nodeName === node.nodeName) {
      pos += 1;
    }
    tmp = tmp.previousSibling;
  }
  return pos;
}
