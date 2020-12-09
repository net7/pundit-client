import { evaluateSimpleXPath } from './evaluateSimpleXpath';

/**
 * Finds an element node using an XPath relative to `root`
 *
 * Example:
 *   node = nodeFromXPath('/main/article[1]/p[3]', document.body)
 *
 * @param {string} xpath
 * @param {Element} [root]
 * @return {Node|null}
 */
export function nodeFromXPath(xpath, root = document.body) {
  try {
    return evaluateSimpleXPath(xpath, root);
  } catch (err) {
    return (document.evaluate(
      `.${xpath}`,
      root,

      // nb. The `namespaceResolver` and `result` arguments are optional in the spec
      // but required in Edge Legacy.
      null /* namespaceResolver */,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null /* result */
    ) || {}).singleNodeValue || null;
  }
}
