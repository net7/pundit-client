import { AnnotationModel } from '../../../../common/models';
import { ChromePageAnnotationCacheItem } from '../../types';
import { ChromeExtStorage } from '../storage';

const StorageCacheKey = 'page-annotations-cache';
const SIZE_LIMIT = 1000;
const TIME_LIMIT = 60 * 60 * 24 * 7; // one week in seconds

const cacheCheck = (cacheKey, active) => ChromeExtStorage.get(StorageCacheKey)
  .then((cache: ChromePageAnnotationCacheItem[]) => {
    const newCache = cache || [];
    const cacheItem = newCache.find(({ key }) => key === cacheKey);
    let value = null;
    let indexToRemove = -1;
    let cacheUpdate$ = Promise.resolve(null);
    // pundit inactive
    if (!active) {
      // key exists
      if (cacheItem) {
        const now = new Date();
        const created = new Date(cacheItem.created);
        const diff = (now.getTime() - created.getTime()) / 1000;
        if (diff < TIME_LIMIT) {
          value = cacheItem.value;
        } else {
          indexToRemove = newCache.findIndex(({ key }) => key === cacheKey);
        }
      }

      // cache size limit
      if (indexToRemove === -1 && newCache.length >= SIZE_LIMIT) {
        indexToRemove = 0;
      }

    // pundit active
    } else if (active && cacheItem) {
      indexToRemove = newCache.findIndex(({ key }) => key === cacheKey);
    }

    // cache update check
    if (indexToRemove !== -1) {
      newCache.splice(indexToRemove, 1);
      cacheUpdate$ = ChromeExtStorage.set(StorageCacheKey, newCache);
    }

    return cacheUpdate$.then(() => Promise.resolve({ cache: newCache, value }));
  });

const getCacheKey = ({ pageContext, pageMetadata }) => {
  // canonical url
  if (pageMetadata) {
    return pageMetadata[0].value;
  }
  // default url
  return pageContext;
};

export const doPageAnnotationsRequest = (
  tabId,
  payload
) => {
  const cacheKey = getCacheKey(payload);
  const { active } = payload;
  return cacheCheck(cacheKey, active).then(({ cache, value }) => {
    // pundit active (skip)
    if (active) {
      return Promise.resolve({ tabId, total: null });
    }

    // has cache value
    if (value !== null) {
      return Promise.resolve({ tabId, total: value });
    }

    // get total value API
    const { pageContext, pageMetadata } = payload;
    return AnnotationModel.search(pageContext, pageMetadata).then((response) => {
      const { stats } = response.data;
      const { total } = stats;
      cache.push({
        key: cacheKey,
        value: total || 0,
        created: new Date().toISOString()
      });
      return ChromeExtStorage.set(StorageCacheKey, cache)
        .then(() => Promise.resolve({ tabId, total }));
    });
  });
};
