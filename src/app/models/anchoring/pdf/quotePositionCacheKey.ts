/**
 * Return a cache key for lookups in `quotePositionCache`.
 *
 * @param {string} quote
 * @param {number} [pos] - Offset in document text
 */
export function quotePositionCacheKey(quote: string, pos: number): string {
  return `${quote}:${pos}`;
}
