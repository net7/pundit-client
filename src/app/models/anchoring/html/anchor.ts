import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from '../anchors';
import {
  QuerySelectorOptions,
  SelectorWithType,
  TextPositionSelectorWithType,
  TextQuoteSelectorWithType,
  RangeSelectorWithType
} from '../types';
import { querySelector } from './querySelector';

/**
 * Anchor a set of selectors.
 *
 * This function converts a set of selectors into a document range.
 * It encapsulates the core anchoring algorithm, using the selectors alone or
 * in combination to establish the best anchor within the document.
 *
 * @param {Node} root - The root element of the anchoring context.
 * @param {Selector[]} selectors - The selectors to try.
 * @param {Object} [options]
 *   @param {number} [options.hint]
 */
export function anchor(
  root: HTMLElement,
  selectors: SelectorWithType[],
  options: QuerySelectorOptions = {}
) {
  let textPositionSelector: TextPositionSelectorWithType | null = null;
  let textQuoteSelector: TextQuoteSelectorWithType | null = null;
  let rangeSelector: RangeSelectorWithType | null = null;

  // Collect all the selectors
  selectors.forEach((selector: SelectorWithType) => {
    switch (selector.type) {
      case 'TextPositionSelector':
        textPositionSelector = selector;
        options.hint = textPositionSelector.start; // TextQuoteAnchor hint
        break;
      case 'TextQuoteSelector':
        textQuoteSelector = selector;
        break;
      case 'RangeSelector':
        rangeSelector = selector;
        break;
      default:
        break;
    }
  });

  /**
   * Assert the quote matches the stored quote, if applicable
   * @param {Range} range
   */
  const maybeAssertQuote = (range: Range) => {
    if (textQuoteSelector?.exact && range.toString() !== textQuoteSelector.exact) {
      throw new Error('quote mismatch');
    } else {
      return range;
    }
  };

  // From a default of failure, we build up catch clauses to try selectors in
  // order, from simple to complex.
  /** @type {Promise<Range>} */
  let promise: Promise<Range> | Promise<never> = Promise.reject(Error('unable to anchor'));

  if (rangeSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = RangeAnchor.fromSelector(root, rangeSelector);
      return querySelector(selectedAnchor, options).then(maybeAssertQuote);
    });
  }

  if (textPositionSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = TextPositionAnchor.fromSelector(root, textPositionSelector);
      return querySelector(selectedAnchor, options).then(maybeAssertQuote);
    });
  }

  if (textQuoteSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = TextQuoteAnchor.fromSelector(root, textQuoteSelector);
      return querySelector(selectedAnchor, options);
    });
  }

  return promise;
}
