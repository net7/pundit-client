/*
  eslint-disable
    @typescript-eslint/no-use-before-define,
    no-restricted-syntax
*/
import { RangeSelector } from '../types';
import { getTextNodes } from '../xpath-util';
import helpers from '../helpers';
import { nodeFromXPath } from '../xpath';
// import { BrowserRange } from '.';

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
   * Returns a normalized range.
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

    return range;
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
