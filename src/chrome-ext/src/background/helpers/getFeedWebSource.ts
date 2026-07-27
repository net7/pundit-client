/**
 * Real (decoded) document URL from a feed web URL
 * (FEED_WEB_BASE_URL + '?url=<encoded once>'). See getFeedPdfSource for the
 * single-encode-on-the-wire / decoded-in-memory convention.
 */
export const getFeedWebSource = (url: string): string => new URL(url).searchParams.get('url') ?? '';
