/* eslint-disable no-restricted-syntax */

import { replaceWith } from './replaceWith';

/**
 * Remove highlights from a range previously highlighted with `highlightRange`.
 *
 * @param {HighlightElement[]} highlights - The highlight elements returned by `highlightRange`
 */
export function removeHighlights(highlights: HighlightElement[]) {
  for (const h of highlights) {
    if (h.parentNode) {
      const children = Array.from(h.childNodes);
      replaceWith(h, children);
    }

    if (h.svgHighlight) {
      h.svgHighlight.remove();
    }
  }
}
