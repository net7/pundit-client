import { quote, TextQuoteSelector } from '@pundit/anchoring';
import { QuerySelectorOptions, TextQuoteSelectorWithType } from '../types';
import { TextPositionAnchor } from './text-position-anchor';

/**
 * Converts between `TextQuoteSelector` selectors and `Range` objects.
 */
export class TextQuoteAnchor {
  /**
   * @param {Node|TextContentNode} root - A root element from which to anchor.
   * @param {string} exact
   * @param {Object} context
   *   @param {string} [context.prefix]
   *   @param {string} [context.suffix]
   */
  constructor(
    public root: HTMLElement,
    public exact: string,
    public context: any = {}
  ) {
    this.root = root;
    this.exact = exact;
    this.context = context;
  }

  /**
   * @param {Node} root
   * @param {Range} range
   */
  static fromRange(root: HTMLElement, range: Range) {
    const selector = quote.fromRange(root, range);
    return TextQuoteAnchor.fromSelector(root, selector);
  }

  /**
   * @param {Node|TextContentNode} root
   * @param {TextQuoteSelector} selector
   */
  static fromSelector(root: HTMLElement, selector: TextQuoteSelector) {
    const { prefix, suffix } = selector;
    return new TextQuoteAnchor(root, selector.exact, { prefix, suffix });
  }

  /**
   * @return {TextQuoteSelector}
   */
  toSelector(): TextQuoteSelectorWithType {
    return {
      type: 'TextQuoteSelector',
      exact: this.exact,
      prefix: this.context.prefix,
      suffix: this.context.suffix,
    };
  }

  /**
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   *     https://github.com/tilgovi/dom-anchor-text-quote#totextpositionroot-selector-options
   */
  toRange(options: QuerySelectorOptions = {}) {
    const range = quote.toRange(this.root, this.toSelector(), options);
    if (range === null) {
      throw new Error('Quote not found');
    }
    return range;
  }

  /**
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   *     https://github.com/tilgovi/dom-anchor-text-quote#totextpositionroot-selector-options
   */
  toPositionAnchor(options: QuerySelectorOptions = {}) {
    const anchor = quote.toTextPosition(this.root, this.toSelector(), options);
    if (anchor === null) {
      throw new Error('Quote not found');
    }
    return new TextPositionAnchor(this.root, anchor.start, anchor.end);
  }
}
