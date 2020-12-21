/*
  eslint-disable
    @typescript-eslint/no-use-before-define,
    no-restricted-syntax,
    max-classes-per-file
*/
import { BrowserNormalizedRange, RangeSelector } from '../types';
import {
  getFirstTextNodeNotBefore,
  getLastTextNodeUpTo,
  getTextNodes,
  xpathFromNode
} from '../xpath-util';
import helpers from '../helpers';
import { nodeFromXPath } from '../xpath';

/**
 * A range suitable for storing in local storage or serializing to JSON.
 */
export class SerializedRange {
  public startContainer: string | number;

  public startOffset: number;

  public endContainer: string | number;

  public endOffset: number;

  /**
   * Creates a SerializedRange
   *
   * obj - The stored object. It should have the following properties.
   *       start:       An xpath to the Element containing the first TextNode
   *                    relative to the root Element.
   *       startOffset: The offset to the start of the selection from obj.start.
   *       end:         An xpath to the Element containing the last TextNode
   *                    relative to the root Element.
   *       startOffset: The offset to the end of the selection from obj.end.
   *
   * Returns an instance of SerializedRange
   */
  constructor({
    startContainer,
    startOffset,
    endContainer,
    endOffset
  }: RangeSelector) {
    this.startContainer = startContainer;
    this.startOffset = startOffset;
    this.endContainer = endContainer;
    this.endOffset = endOffset;
  }

  /**
   * Creates a NormalizedRange.
   *
   * root - The root Element from which the XPaths were generated.
   *
   * Returns a NormalizedRange instance.
   */
  normalize(root) {
    const range = {} as Range;

    for (const p of ['start', 'end']) {
      let node;
      try {
        node = nodeFromXPath(this[`${p}Container`], root);
        if (!node) {
          throw new Error('Node not found');
        }
      } catch (e) {
        throw new RangeError(`Error while finding ${p} node: ${this[`${p}Container`]}: ${e}`);
      }
      // Unfortunately, we *can't* guarantee only one textNode per
      // elementNode, so we have to walk along the element's textNodes until
      // the combined length of the textNodes to that point exceeds or
      // matches the value of the offset.
      let length = 0;
      let targetOffset = this[`${p}Offset`];

      // Range excludes its endpoint because it describes the boundary position.
      // Target the string index of the last character inside the range.
      if (p === 'end') {
        targetOffset -= 1;
      }

      for (const tn of getTextNodes(node)) {
        if (length + tn.data.length > targetOffset) {
          range[`${p}Container`] = tn;
          range[`${p}Offset`] = this[`${p}Offset`] - length;
          break;
        } else {
          length += tn.data.length;
        }
      }

      // If we fall off the end of the for loop without having set
      // 'startOffset'/'endOffset', the element has shorter content than when
      // we annotated, so throw an error:
      if (range[`${p}Offset`] === undefined) {
        throw new RangeError(
          `Couldn't find offset ${this[`${p}Offset`]} in element ${this[`${p}Container`]}`
        );
      }
    }

    for (const parent of helpers.parents((range as any).startContainer)) {
      if (parent.contains(range.endContainer)) {
        (range as any).commonAncestorContainer = parent;
        break;
      }
    }

    return new BrowserRange(range).normalize();
  }

  /**
   * Creates a range suitable for storage.
   *
   * root           - A root Element from which to anchor the serialization.
   *
   * Returns an instance of SerializedRange.
   */
  serialize(root) {
    return this.normalize(root).serialize(root);
  }

  // Returns the range as an Object literal.
  toObject() {
    return {
      startContainer: this.startContainer,
      startOffset: this.startOffset,
      endContainer: this.endContainer,
      endOffset: this.endOffset,
    };
  }
}

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

/**
 * Creates a wrapper around a range object obtained from a DOMSelection.
 */
export class BrowserRange {
  public commonAncestorContainer: Node;

  public startContainer: Node;

  public startOffset: number;

  public endContainer: Node;

  public endOffset: number;

  public tainted = false;

  /**
   * Creates an instance of BrowserRange.
   *
   * object - A range object obtained via DOMSelection#getRangeAt().
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   range = new Range.BrowserRange(selection.getRangeAt(0))
   *
   * Returns an instance of BrowserRange.
   */
  constructor(range: Range) {
    this.commonAncestorContainer = range.commonAncestorContainer;
    this.startContainer = range.startContainer;
    this.startOffset = range.startOffset;
    this.endContainer = range.endContainer;
    this.endOffset = range.endOffset;
  }

  /**
   * normalize works around the fact that browsers don't generate
   * ranges/selections in a consistent manner. Some (Safari) will create
   * ranges that have (say) a textNode startContainer and elementNode
   * endContainer. Others (Firefox) seem to only ever generate
   * textNode/textNode or elementNode/elementNode pairs.
   *
   * Returns an instance of NormalizedRange
   */
  normalize() {
    if (this.tainted) {
      throw new Error('You may only call normalize() once on a BrowserRange!');
    } else {
      this.tainted = true;
    }
    const range = {} as BrowserNormalizedRange;

    // Look at the start
    if (this.startContainer.nodeType === Node.ELEMENT_NODE) {
      // We are dealing with element nodes
      if (this.startOffset < this.startContainer.childNodes.length) {
        range.startContainer = getFirstTextNodeNotBefore(
          this.startContainer.childNodes[this.startOffset]
        );
      } else {
        range.startContainer = getFirstTextNodeNotBefore(this.startContainer);
      }
      range.startOffset = 0;
    } else {
      // We are dealing with simple text nodes
      range.startContainer = this.startContainer;
      range.startOffset = this.startOffset;
    }

    // Look at the end
    if (this.endContainer.nodeType === Node.ELEMENT_NODE) {
      // Get specified node.
      let node = this.endContainer.childNodes[this.endOffset];
      // Does that node exist?
      if (node) {
        // Look for a text node either at the immediate beginning of node
        let n = node;
        while (n && n.nodeType !== Node.TEXT_NODE) {
          n = n.firstChild;
        }
        // Did we find a text node at the start of this element?
        if (n) {
          range.endContainer = n;
          range.endOffset = 0;
        }
      }

      if (!range.endContainer) {
        // We need to find a text node in the previous sibling of the node at the
        // given offset, if one exists, or in the previous sibling of its container.
        if (this.endOffset) {
          node = this.endContainer.childNodes[this.endOffset - 1];
        } else {
          node = this.endContainer.previousSibling;
        }
        range.endContainer = getLastTextNodeUpTo(node);
        range.endOffset = range.endContainer.nodeValue.length;
      }
    } else {
      // We are dealing with simple text nodes
      range.endContainer = this.endContainer;
      range.endOffset = this.endOffset;
    }

    // We have collected the initial data.
    // Now let's start to slice & dice the text elements!
    const normalRange = {} as BrowserNormalizedRange;

    if (range.startOffset > 0) {
      // Do we really have to cut?
      if (
        !range.startContainer.nextSibling
        || range.startContainer.nodeValue.length > range.startOffset
      ) {
        // Yes. Cut.
        normalRange.startContainer = (range.startContainer as Text).splitText(range.startOffset);
      } else {
        // Avoid splitting off zero-length pieces.
        normalRange.startContainer = getFirstTextNodeNotBefore(range.startContainer.nextSibling);
      }
    } else {
      normalRange.startContainer = range.startContainer;
    }

    // Is the whole selection inside one text element?
    if (range.startContainer === range.endContainer) {
      if (
        normalRange.startContainer.nodeValue.length
        > range.endOffset - range.startOffset
      ) {
        (normalRange.startContainer as Text).splitText(range.endOffset - range.startOffset);
      }
      normalRange.endContainer = normalRange.startContainer;
    } else {
      // No, the end of the selection is in a separate text element
      // does the end need to be cut?
      if (range.endContainer.nodeValue.length > range.endOffset) {
        (range.endContainer as Text).splitText(range.endOffset);
      }
      normalRange.endContainer = range.endContainer;
    }

    // Make sure the common ancestor is an element node.
    normalRange.commonAncestor = this.commonAncestorContainer;
    while (normalRange.commonAncestor.nodeType !== Node.ELEMENT_NODE) {
      normalRange.commonAncestor = normalRange.commonAncestor.parentNode;
    }

    // Circular dependency. Remove this once *Range classes are refactored
    // eslint-disable-next-line no-use-before-define
    return new NormalizedRange(normalRange);
  }

  /**
   * Creates a range suitable for storage.
   *
   * root           - A root Element from which to anchor the serialization.
   *
   * Returns an instance of SerializedRange.
   */
  serialize(root: HTMLElement) {
    return this.normalize().serialize(root);
  }
}
