// FIXME: adattare a logica pundit
import { isInPlaceholder } from '../../anchoring/pdf/placeholder';

/**
 * Return true if `anchor` is in an un-rendered page.
 *
 * @param {Anchor} anchor
 */
export function anchorIsInPlaceholder(anchor) {
  const highlight = anchor.highlights?.[0];
  return highlight && isInPlaceholder(highlight);
}
