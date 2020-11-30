import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from '../anchors';

/**
 * @param {Node} root
 * @param {Range} range
 */
export function describe(root, range) {
  const types = [RangeAnchor, TextPositionAnchor, TextQuoteAnchor];
  const result = [];
  types.forEach((type) => {
    try {
      const selectedAnchor = type.fromRange(root, range);
      result.push(selectedAnchor.toSelector());
    } catch (error) {
      // do nothing
    }
  });
  return result;
}
