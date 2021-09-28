/**
 * Return the text layer element of the PDF page containing `node`.
 *
 * @param {Node|Element} node
 * @return {Element|null}
 */
export function getNodeTextLayer(node: Node): Node {
  const el = 'closest' in node ? node : node.parentElement;
  return (el as Element)?.closest('.textLayer') ?? null;
}
