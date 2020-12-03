import { getPageTextContent } from './getPageContext';

/**
 * Return the offset in the text for the whole document at which the text for
 * `pageIndex` begins.
 *
 * @param {number} pageIndex
 * @return {Promise<number>} - Character position at which page text starts
 */
export function getPageOffset(pageIndex) {
  let index = -1;

  const next = (offset) => {
    index += 1;
    if (index === pageIndex) {
      return Promise.resolve(offset);
    }

    return getPageTextContent(index).then((textContent) => next(offset + textContent.length));
  };

  return next(0);
}
