import { pageTextCache, quotePositionCache } from './state';

/**
 * Clear this module's internal caches.
 *
 * This exists mainly as a helper for use in tests.
 */
export function purgeCache() {
  pageTextCache.clear();
  quotePositionCache.clear();
}
