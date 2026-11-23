import { getTabKind } from './getTabKind';

jest.mock('./isPdfViewer', () => ({
  isPdfViewer: (url: string) => url.startsWith('chrome-extension://pundit/pdf-viewer.html'),
}));
jest.mock('./isFeedWebUrl', () => ({ isFeedWebUrl: (url: string) => url.startsWith('https://feed.example.org/?url=') }));
jest.mock('./isFeedPdfUrl', () => ({ isFeedPdfUrl: (url: string) => url.startsWith('https://feed.example.org/pdf.php?source=') }));

describe('getTabKind', () => {
  it.each([
    ['chrome-extension://pundit/pdf-viewer.html?source=https%3A%2F%2Fx%2Fa.pdf', 'viewer'],
    ['https://feed.example.org/?url=https%3A%2F%2Fexample.com', 'feed-web'],
    ['https://feed.example.org/pdf.php?source=https%3A%2F%2Fx%2Fa.pdf', 'feed-pdf'],
    ['https://example.com/', 'web'],
    ['http://example.com/page', 'web'],
    ['https://arxiv.org/pdf/1706.03762', 'web'],
    ['file:///home/user/doc.pdf', 'web'],
    ['https://chrome.google.com/search?q=webstore', 'web'],
  ])('%s is %s', (url, kind) => {
    expect(getTabKind(url)).toBe(kind);
  });

  it.each([
    'chrome://extensions/?id=abc',
    'chrome://newtab/',
    'edge://newtab',
    'brave://settings',
    'opera://startpage',
    'about:blank',
    'view-source:https://example.com/',
    'data:text/html,hi',
    'chrome-extension://other/page.html',
    'https://chromewebstore.google.com/detail/pundit/abc',
    'https://chrome.google.com/webstore/detail/abc',
    'https://microsoftedge.microsoft.com/addons/detail/abc',
    'not a url',
    '',
    undefined,
  ])('%s is unsupported', (url) => {
    expect(getTabKind(url)).toBe('unsupported');
  });
});
