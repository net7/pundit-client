import { BrowserNormalizedRange } from '../types';
import { getFirstTextNodeNotBefore, getLastTextNodeUpTo } from '../xpath-util';
import { NormalizedRange } from './normalized-range';

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
        range.start = getFirstTextNodeNotBefore(
          this.startContainer.childNodes[this.startOffset]
        );
      } else {
        range.start = getFirstTextNodeNotBefore(this.startContainer);
      }
      range.startOffset = 0;
    } else {
      // We are dealing with simple text nodes
      range.start = this.startContainer;
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
          range.end = n;
          range.endOffset = 0;
        }
      }

      if (!range.end) {
        // We need to find a text node in the previous sibling of the node at the
        // given offset, if one exists, or in the previous sibling of its container.
        if (this.endOffset) {
          node = this.endContainer.childNodes[this.endOffset - 1];
        } else {
          node = this.endContainer.previousSibling;
        }
        range.end = getLastTextNodeUpTo(node);
        range.endOffset = range.end.nodeValue.length;
      }
    } else {
      // We are dealing with simple text nodes
      range.end = this.endContainer;
      range.endOffset = this.endOffset;
    }

    // We have collected the initial data.
    // Now let's start to slice & dice the text elements!
    const normalRange = {} as BrowserNormalizedRange;

    if (range.startOffset > 0) {
      // Do we really have to cut?
      if (
        !range.start.nextSibling
        || range.start.nodeValue.length > range.startOffset
      ) {
        // Yes. Cut.
        normalRange.start = (range.start as Text).splitText(range.startOffset);
      } else {
        // Avoid splitting off zero-length pieces.
        normalRange.start = getFirstTextNodeNotBefore(range.start.nextSibling);
      }
    } else {
      normalRange.start = range.start;
    }

    // Is the whole selection inside one text element?
    if (range.start === range.end) {
      if (
        normalRange.start.nodeValue.length
        > range.endOffset - range.startOffset
      ) {
        (normalRange.start as Text).splitText(range.endOffset - range.startOffset);
      }
      normalRange.end = normalRange.start;
    } else {
      // No, the end of the selection is in a separate text element
      // does the end need to be cut?
      if (range.end.nodeValue.length > range.endOffset) {
        (range.end as Text).splitText(range.endOffset);
      }
      normalRange.end = range.end;
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
