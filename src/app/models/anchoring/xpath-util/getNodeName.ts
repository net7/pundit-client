/**
 * Get the node name for use in generating an xpath expression.
 *
 * @param {Node} node
 */
export function getNodeName(node) {
  const nodeName = node.nodeName.toLowerCase();
  let result = nodeName;
  if (nodeName === '#text') {
    result = 'text()';
  }
  return result;
}
