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
    } if (typeof range.start === 'string') {
      return new SerializedRange(range);
    } if (range.start && typeof range.start === 'object') {
      return new NormalizedRange(range);
    }
    throw new Error('Could not sniff range type');
  },

  parents(node) {
    const parents = [];
    while (node.parentElement) {
      parents.push(node.parentElement);
      node = node.parentElement;
    }
    return parents;
  }
};
