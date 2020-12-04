import { BrowserRange, NormalizedRange, SerializedRange } from './ranges';

export default {
  /**
   * Determines the type of Range of the provided object and returns
   * a suitable Range instance.
   *
   * r - A range Object.
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   Range.sniff(selection.getRangeAt(0))
   *   # => Returns a BrowserRange instance.
   *
   * Returns a Range object or false.
   * */
  sniff(range) {
    if (range.commonAncestorContainer !== undefined) {
      return new BrowserRange(range);
    } if (typeof range.startContainer === 'string') {
      return new SerializedRange(range);
    } if (range.startContainer && typeof range.startContainer === 'object') {
      return new NormalizedRange(range);
    }
    throw new Error('Could not sniff range type');
  },

  parents(node: HTMLElement) {
    const parents = [];
    let selectedNode = node;
    while (selectedNode.parentElement) {
      parents.push(selectedNode.parentElement);
      selectedNode = selectedNode.parentElement;
    }
    return parents;
  }
};
