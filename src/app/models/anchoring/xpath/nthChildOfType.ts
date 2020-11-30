/**
 * Return the `index`'th immediate child of `element` whose tag name is
 * `nodeName` (case insensitive).
 *
 * @param {Element} element
 * @param {string} nodeName
 * @param {number} index
 */
export function nthChildOfType(element, nodeName, index) {
  const upperName = nodeName.toUpperCase();

  let matchIndex = -1;
  for (let i = 0; i < element.children.length; i += 1) {
    const child = element.children[i];
    if (child.nodeName.toUpperCase() === upperName) {
      matchIndex += 1; // fixed from ++matchIndex
      if (matchIndex === index) {
        return child;
      }
    }
  }

  return null;
}
