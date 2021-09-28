/**
 * Return offset of `node` among its siblings
 *
 * @param {Node} node
 */
export function getSiblingIndex(node: Node): number {
  let index = 0;
  let currentNode = node;
  while (node.previousSibling) {
    index += 1;
    currentNode = currentNode.previousSibling;
  }
  return index;
}
