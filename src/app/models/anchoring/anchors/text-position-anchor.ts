import { position, TextPosition } from '@pundit/anchoring';
import { TextPositionSelectorWithType } from '../types';

export class TextPositionAnchor {
  /**
   * @param {Node|TextContentNode} root
   * @param {number} start
   * @param {number} end
   */
  constructor(
    public root: HTMLElement,
    public start: number,
    public end: number
  ) {
    this.root = root;
    this.start = start;
    this.end = end;
  }

  /**
   * @param {Node} root
   * @param {Range} range
   */
  static fromRange(root: HTMLElement, range: Range) {
    const selector = position.fromRange(root, range);
    return TextPositionAnchor.fromSelector(root, selector);
  }

  /**
   * @param {Node} root
   * @param {TextPositionSelector} selector
   */
  static fromSelector(root: HTMLElement, selector: TextPosition) {
    return new TextPositionAnchor(root, selector.start, selector.end);
  }

  /**
   * @return {TextPositionSelector}
   */
  toSelector(): TextPositionSelectorWithType {
    return {
      type: 'TextPositionSelector',
      start: this.start,
      end: this.end,
    };
  }

  toRange() {
    return position.toRange(this.root, { start: this.start, end: this.end });
  }
}
