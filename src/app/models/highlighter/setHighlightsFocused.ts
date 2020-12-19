import { HighlightElement } from '.';
import { _c } from '../config';

/**
 * Set whether the given highlight elements should appear "focused".
 *
 * A highlight can be displayed in a different ("focused") style to indicate
 * that it is current in some other context - for example the user has selected
 * the corresponding annotation in the sidebar.
 *
 * @param {HighlightElement[]} highlights
 * @param {boolean} focused
 */
export function setHighlightsFocused(highlights: HighlightElement[], focused: boolean) {
  highlights.forEach((h) => h.classList.toggle(`${_c('highlightTag')}-focused`, focused));
}
