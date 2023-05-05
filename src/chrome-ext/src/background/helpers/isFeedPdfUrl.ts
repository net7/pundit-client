declare const FEED_PDF_BASE_URL: string;

export const isFeedPdfUrl = (url: string) => typeof url === 'string' && url.indexOf(
  FEED_PDF_BASE_URL
) === 0;
