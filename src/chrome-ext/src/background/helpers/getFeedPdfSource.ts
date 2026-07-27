/**
 * Real (decoded) document URL from a feed PDF URL
 * (FEED_PDF_BASE_URL + '?source=<encoded once>'). The URL travels encoded
 * exactly once on the wire; this returns the canonical, non-encoded URL — the
 * same identity used for annotations — so callers must NOT decode it again, and
 * the builder (redirectToPdfViewer) encodes it exactly once. Using the URL API
 * (not a raw split) also strips any feed-side fragment (e.g. '#extension=.pdf').
 */
export const getFeedPdfSource = (url: string): string => new URL(url).searchParams.get('source') ?? '';
