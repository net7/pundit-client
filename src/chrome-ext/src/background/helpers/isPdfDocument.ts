import { getPdfViewerPath } from '.';

const PDF_CONTENT_TYPE = 'application/pdf';

/** Only web pages can be fetched to read their type; other schemes (chrome:, about:, …) cannot. */
const isWebUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

/**
 * Whether the tab's URL is a PDF document: by its `.pdf` extension, otherwise
 * by the `Content-Type` of a web URL. The request is aborted as soon as the
 * headers arrive, so the document itself is not downloaded.
 */
export const isPdfDocument = async (url: string) => {
  if (typeof url !== 'string' || url.startsWith(getPdfViewerPath())) {
    return false;
  }
  if (url.includes('.pdf')) {
    return true;
  }
  if (!isWebUrl(url)) {
    return false;
  }
  const controller = new AbortController();
  try {
    const response = await fetch(url, { signal: controller.signal });
    const contentType = response.headers.get('Content-Type') || '';
    return contentType.split(';')[0].trim().toLowerCase() === PDF_CONTENT_TYPE;
  } catch {
    // unreachable host, blocked request: not a PDF we can open
    return false;
  } finally {
    controller.abort();
  }
};
