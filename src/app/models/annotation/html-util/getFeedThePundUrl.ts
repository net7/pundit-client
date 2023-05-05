import { getDocumentHref } from './getDocumentHref';

const FEED_THE_PUND_BASE_URL = 'https://feed.thepund.it/?url=';

export function getFeedThePundUrl(): string {
  const href = getDocumentHref();
  if (href.indexOf(FEED_THE_PUND_BASE_URL) === 0) {
    return href.replace(FEED_THE_PUND_BASE_URL, '');
  }
  return null;
}
