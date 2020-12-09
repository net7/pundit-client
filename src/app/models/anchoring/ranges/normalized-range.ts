import helpers from '../helpers';
import { BrowserNormalizedRange } from '../types';
import { getTextNodes, xpathFromNode } from '../xpath-util';
import { SerializedRange } from './serialized-range';

/**
 * A normalized range is most commonly used throughout the annotator.
 * its the result of a deserialized SerializedRange or a BrowserRange without
 * browser inconsistencies.
 */
export class NormalizedRange {
  public commonAncestor: Node;

  public startContainer: Node;

  public endContainer: Node;

  /**
   * Creates an instance of a NormalizedRange.
   *
   * This is usually created by calling the .normalize() method on one of the
   * other Range classes rather than manually.
   *
   * obj - An Object literal. Should have the following properties.
   *       commonAncestor: A Element that encompasses both the startContainer and endContainer nodes
   *       startContainer:          The first TextNode in the range.
   *       endContainer             The last TextNode in the range.
   *
   * Returns an instance of NormalizedRange.
   */
  constructor({
    commonAncestor,
    startContainer,
    endContainer
  }: BrowserNormalizedRange) {
    this.commonAncestor = commonAncestor;
    this.startContainer = startContainer;
    this.endContainer = endContainer;
  }

  /**
   * For API consistency.
   *
   * Returns itself.
   */
  normalize() {
    return this;
  }

  /**
   * Limits the nodes within the NormalizedRange to those contained
   * withing the bounds parameter. It returns an updated range with all
   * properties updated. NOTE: Method returns null if all nodes fall outside
   * of the bounds.
   *
   * bounds - An Element to limit the range to.
   *
   * Returns updated self or null.
   */
  limit(bounds) {
    const nodes = this.textNodes().filter((node) => bounds.contains(node.parentNode));
    if (!nodes.length) {
      return null;
    }

    // eslint-disable-next-line prefer-destructuring
    this.startContainer = nodes[0];
    this.endContainer = nodes[nodes.length - 1];

    const startParents = helpers.parents(this.startContainer as HTMLElement);

    helpers.parents(this.endContainer as HTMLElement).forEach((parent) => {
      if (startParents.indexOf(parent) !== -1) {
        this.commonAncestor = parent;
      }
    });

    return this;
  }

  /**
   * Convert this range into an object consisting of two pairs of (xpath,
   * character offset), which can be easily stored in a database.
   *
   * root -           The root Element relative to which XPaths should be calculated
   *
   * Returns an instance of SerializedRange.
   */
  serialize(root?: HTMLElement) {
    const serialization = (node: Node, isEnd?: boolean) => {
      const origParent = node.parentElement;
      const xpath = xpathFromNode(origParent, root ?? document);
      const textNodes = getTextNodes(origParent);
      // Calculate real offset as the combined length of all the
      // preceding textNode siblings. We include the length of the
      // node if it's the end node.
      const nodes = textNodes.slice(0, textNodes.indexOf(node));
      let offset = 0;
      nodes.forEach((n) => {
        offset += n.data.length;
      });

      if (isEnd) {
        return [xpath, offset + node.nodeValue.length];
      }
      return [xpath, offset];
    };

    const start = serialization(this.startContainer);
    const end = serialization(this.endContainer, true);

    // Circular dependency. Remove this once *Range classes are refactored
    // eslint-disable-next-line no-use-before-define
    return new SerializedRange({
      // XPath strings
      startContainer: `${start[0]}`,
      endContainer: `${end[0]}`,
      // Character offsets (integer)
      startOffset: +start[1],
      endOffset: +end[1],
    });
  }

  /**
   * Creates a concatenated String of the contents of all the text nodes
   * within the range.
   *
   * Returns a String.
   */
  text(): string {
    return this.textNodes()
      .map((node) => node.nodeValue)
      .join('');
  }

  /**
   * Fetches only the text nodes within the range.
   *
   * Returns an Array of TextNode instances.
   */
  textNodes() {
    const textNodes = getTextNodes(this.commonAncestor);
    const start = textNodes.indexOf(this.startContainer);
    const end = textNodes.indexOf(this.endContainer);
    // Return the textNodes that fall between the start and end indexes.
    return textNodes.slice(start, +end + 1 || undefined);
  }

  /**
   * Converts the Normalized range to a native browser range.
   *
   * See: https://developer.mozilla.org/en/DOM/range
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   selection.removeAllRanges()
   *   selection.addRange(normedRange.toRange())
   *
   * Returns a Range object.
   */
  toRange(): Range {
    const range = document.createRange();
    range.setStartBefore(this.startContainer);
    range.setEndAfter(this.endContainer);
    return range;
  }
}
