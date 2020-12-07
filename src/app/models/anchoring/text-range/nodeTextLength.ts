/**
 * Return the combined length of text nodes contained in `node`.
 *
 * @param {Node} node
 */
export function nodeTextLength(node: Node) {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
    case Node.TEXT_NODE:
      // nb. `textContent` excludes text in comments and processing instructions
      // when called on a parent element, so we don't need to subtract that here.

      return /** @type {string} */ (node.textContent).length;
    default:
      return 0;
  }
}
