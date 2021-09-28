// Caches for performance.

/**
 * Map of page index to page text content.
 *
 * @type {Map<number, Promise<string>>}
 */
export const pageTextCache = new Map();

/**
  * A cache that maps a `{quote}:{offset}` key to a specific
  * location in the document.
  *
  * The components of the key come from an annotation's selectors. This is used
  * to speed up re-anchoring an annotation that was previously anchored in the
  * current session.
  *
  * @type {Map<string, PdfTextRange>}
  */
export const quotePositionCache = new Map();
