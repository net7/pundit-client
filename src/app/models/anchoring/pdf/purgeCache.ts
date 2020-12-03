import { PageTextCache } from './pageTextCache';
import { QuotePositionCache } from './quotePositionCache';

/**
 * Clear this module's internal caches.
 *
 * This exists mainly as a helper for use in tests.
 */
export function purgeCache() {
  PageTextCache.data = {};
  QuotePositionCache.data = {};
}
