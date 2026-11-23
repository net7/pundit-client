import { isPdfViewer } from './isPdfViewer';
import { isFeedPdfUrl } from './isFeedPdfUrl';
import { isFeedWebUrl } from './isFeedWebUrl';

export type TabKind = 'viewer' | 'feed-web' | 'feed-pdf' | 'web' | 'unsupported';

/**
 * Schemes where the content script can run. Listed rather than excluded, so
 * that the internal pages of any Chromium-based browser (chrome:, edge:,
 * brave:, opera:, vivaldi:, about:, …) are unsupported without naming them.
 */
const WEB_PROTOCOLS = ['http:', 'https:', 'file:'];

/** Extension stores: web pages where browsers do not run content scripts. */
const EXTENSION_STORES = [
  { host: 'chromewebstore.google.com', path: '/' },
  { host: 'chrome.google.com', path: '/webstore' },
  { host: 'microsoftedge.microsoft.com', path: '/addons' },
];

const isExtensionStore = ({ hostname, pathname }: URL) => EXTENSION_STORES
  .some(({ host, path }) => hostname === host && pathname.startsWith(path));

/**
 * What a tab shows, which decides what the background may do with it:
 * the extension's PDF viewer, a feed URL, a web page or a page where Pundit
 * cannot run.
 */
export const getTabKind = (url?: string): TabKind => {
  if (!url) {
    return 'unsupported';
  }
  if (isPdfViewer(url)) {
    return 'viewer';
  }
  if (isFeedWebUrl(url)) {
    return 'feed-web';
  }
  if (isFeedPdfUrl(url)) {
    return 'feed-pdf';
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'unsupported';
  }
  if (!WEB_PROTOCOLS.includes(parsed.protocol) || isExtensionStore(parsed)) {
    return 'unsupported';
  }
  return 'web';
};
