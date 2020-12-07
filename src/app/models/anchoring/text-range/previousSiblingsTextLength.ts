import { nodeTextLength } from '.';

/**
 * Return the total length of the text of all previous siblings of `node`.
 *
 * @param {Node} node
 */
export function previousSiblingsTextLength(node: Node) {
  let sibling = node.previousSibling;
  let length = 0;
  while (sibling) {
    length += nodeTextLength(sibling);
    sibling = sibling.previousSibling;
  }
  return length;
}
