import { getPathSegment } from './getPathSegment';

/**
 * A simple XPath generator which can generate XPaths of the form
 * /tag[index]/tag[index].
 *
 * @param {Node} node - The node to generate a path to
 * @param {Node} root - Root node to which the returned path is relative
 */
export function xpathFromNode(node, root) {
  let xpath = '';

  /** @type {Node|null} */
  let elem = node;
  while (elem !== root) {
    if (!elem) {
      throw new Error('Node is not a descendant of root');
    }
    xpath = `${getPathSegment(elem)}/${xpath}`;
    elem = elem.parentNode;
  }
  xpath = `/${xpath}`;
  xpath = xpath.replace(/\/$/, ''); // Remove trailing slash

  return xpath;
}
