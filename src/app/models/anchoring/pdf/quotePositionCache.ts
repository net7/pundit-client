import { set as _set, get as _get } from 'lodash';

export class QuotePositionCache {
  /**
  * A cache that maps a `(quote, text offset in document)` key to a specific
  * location in the document.
  *
  * The components of the key come from an annotation's selectors. This is used
  * to speed up re-anchoring an annotation that was previously anchored in the
  * current session.
  *
  * @type {Object<string, Object<number, PdfTextRange>>}
  */
  static data: object = {};

  static setData(key, value) {
    _set(QuotePositionCache.data, key, value);
  }

  static getData(key) {
    return _get(QuotePositionCache.data, key);
  }
}
