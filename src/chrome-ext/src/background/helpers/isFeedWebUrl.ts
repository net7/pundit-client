declare const FEED_WEB_BASE_URL: string;

export const isFeedWebUrl = (url: string) => typeof url === 'string' && url.indexOf(
  FEED_WEB_BASE_URL
) === 0;
