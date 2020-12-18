/**
 * Replace a child `node` with `replacements`.
 *
 * nb. This is like `ChildNode.replaceWith` but it works in older browsers.
 *
 * @param {ChildNode} node
 * @param {Node[]} replacements
 */
export function replaceWith(node: HTMLElement, replacements: HTMLElement[]) {
  const parent = /** @type {Node} */ (node.parentNode);
  replacements.forEach((r) => parent.insertBefore(r, node));
  node.remove();
}
