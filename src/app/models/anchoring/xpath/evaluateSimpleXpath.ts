import { nthChildOfType } from './nthChildOfType';

/**
 * Evaluate a _simple XPath_ relative to a `root` element and return the
 * matching element.
 *
 * A _simple XPath_ is a sequence of one or more `/tagName[index]` strings.
 *
 * Unlike `document.evaluate` this function:
 *
 *  - Only supports simple XPaths
 *  - Is not affected by the document's _type_ (HTML or XML/XHTML)
 *  - Ignores element namespaces when matching element names in the XPath against
 *    elements in the DOM tree
 *  - Is case insensitive for all elements, not just HTML elements
 *
 * The matching element is returned or `null` if no such element is found.
 * An error is thrown if `xpath` is not a simple XPath.
 *
 * @param {string} xpath
 * @param {Element} root
 * @return {Element|null}
 */
export function evaluateSimpleXPath(xpath, root: Element) {
  const isSimpleXPath = xpath.match(/^(\/[A-Za-z0-9-]+(\[[0-9]+\])?)+$/) !== null;
  if (!isSimpleXPath) {
    throw new Error('Expression is not a simple XPath');
  }

  const segments = xpath.split('/');
  let element = root;

  // Remove leading empty segment. The regex above validates that the XPath
  // has at least two segments, with the first being empty and the others non-empty.
  segments.shift();

  // eslint-disable-next-line consistent-return
  segments.forEach((segment) => {
    let elementName: any;
    let elementIndex: number;

    const separatorPos = segment.indexOf('[');
    if (separatorPos !== -1) {
      elementName = segment.slice(0, separatorPos);

      const indexStr = segment.slice(separatorPos + 1, segment.indexOf(']'));
      elementIndex = parseInt(indexStr, 10) - 1;
      if (elementIndex < 0) {
        return null;
      }
    } else {
      elementName = segment;
      elementIndex = 0;
    }

    const child: Element = nthChildOfType(element, elementName, elementIndex);
    if (!child) {
      return null;
    }

    element = child;
  });

  return element;
}
