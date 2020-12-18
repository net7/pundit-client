import { _c } from '../config';
import { removeHighlights } from './removeHighlights';

/**
 * Remove all highlights under a given root element.
 *
 * @param {HTMLElement} root
 */
export function removeAllHighlights(root: HTMLElement) {
  const highlights = Array.from(root.querySelectorAll(_c('highlightTag')));
  removeHighlights(/** @type {HighlightElement[]} */ (highlights));
}
