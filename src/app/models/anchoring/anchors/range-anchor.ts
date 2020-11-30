import helpers from '../helpers';
import { SerializedRange } from '../ranges/serialized-range';
import { RangeSelector, RangeSelectorWithType } from '../types';

/**
 * Converts between `RangeSelector` selectors and `Range` objects.
 */
export class RangeAnchor {
  /**
   * @param {Node} root - A root element from which to anchor.
   * @param {AnyRangeType} range -  A range describing the anchor.
   */
  constructor(
    public root: HTMLElement,
    public range: any
  ) {
    this.root = root;
    this.range = helpers.sniff(range).normalize(this.root);
  }

  /**
   * @param {Node} root -  A root element from which to anchor.
   * @param {AnyRangeType} range -  A range describing the anchor.
   */
  static fromRange(root: HTMLElement, range: any) {
    return new RangeAnchor(root, range);
  }

  /**
   * Create an anchor from a serialized `RangeSelector` selector.
   *
   * @param {Node} root -  A root element from which to anchor.
   * @param {RangeSelector} selector
   */
  static fromSelector(root: HTMLElement, selector: RangeSelector) {
    const range = new SerializedRange(selector);
    return new RangeAnchor(root, range);
  }

  toRange() {
    return this.range.toRange();
  }

  /**
   * @return {RangeSelector}
   */
  toSelector(): RangeSelectorWithType {
    const range = this.range.serialize(this.root);
    return {
      type: 'RangeSelector',
      startContainer: range.start,
      startOffset: range.startOffset,
      endContainer: range.end,
      endOffset: range.endOffset,
    };
  }
}
