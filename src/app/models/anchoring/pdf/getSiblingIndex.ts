/**
 * Return offset of `node` among its siblings
 *
 * @param {Node} node
 */
export function getSiblingIndex(node) {
  let index = 0;
  while (node.previousSibling) {
    index += 1;
    // eslint-disable-next-line no-param-reassign
    node = node.previousSibling;
  }
  return index;
}
