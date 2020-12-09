import { findPage } from './findPageOffset';
import { getPdfViewer } from './getPdfViewer';

/**
 * Return a list of page indexes to search for a quote in priority order.
 *
 * When a position anchor is available, quote search can be optimized by
 * searching pages nearest the expected position first.
 *
 * @param {number} position - Text offset from start of document
 * @return {Promise<number[]>}
 */
export function prioritizePages(position) {
  const pageCount = getPdfViewer().pagesCount;
  const pageIndices = Array(pageCount)
    .fill(0)
    .map((_, i) => i);

  if (!position) {
    return Promise.resolve(pageIndices);
  }

  /**
   * Sort page indexes by offset from `pageIndex`.
   *
   * @param {number} pageIndex
   */
  function sortPages(pageIndex) {
    const left = pageIndices.slice(0, pageIndex);
    const right = pageIndices.slice(pageIndex);
    const result = [];
    while (left.length > 0 || right.length > 0) {
      if (right.length) {
        result.push(/** @type {number} */(right.shift()));
      }
      if (left.length) {
        result.push(/** @type {number} */(left.pop()));
      }
    }
    return result;
  }

  return findPage(position).then(({ index }) => sortPages(index));
}
