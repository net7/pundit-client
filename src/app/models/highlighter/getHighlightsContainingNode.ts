import { HighlightElement } from '.';
import { _c } from '../config';

/**
 * Get the highlight elements that contain the given node.
 *
 * @param {Node} node
 * @return {HighlightElement[]}
 */
export function getHighlightsContainingNode(node: HTMLElement): HighlightElement[] {
  let el = node.nodeType === Node.ELEMENT_NODE
    ? /** @type {Element} */ (node)
    : node.parentElement;

  const highlights = [];

  while (el) {
    if (el.classList.contains(_c('highlightTag'))) {
      highlights.push(/** @type {HighlightElement} */ (el));
    }
    el = el.parentElement;
  }

  return highlights;
}
