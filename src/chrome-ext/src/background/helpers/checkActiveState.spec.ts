import { ChromeExtStorage } from '../storage';
import { checkActiveState } from './checkActiveState';
import * as helpers from '.';
import { onBrowserActionClicked } from '../handlers/onBrowserActionClicked';

const VIEWER = 'chrome-extension://pundit/pdf-viewer.html?source=https%3A%2F%2Fx%2Fa.pdf';
const FEED_WEB = 'https://feed.example.org/?url=https%3A%2F%2Fexample.com';
const FEED_PDF = 'https://feed.example.org/pdf.php?source=https%3A%2F%2Fx%2Fa.pdf';

jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn() } }));
jest.mock('.', () => {
  const actual = jest.requireActual('./getTabKind');
  return {
    getTabKind: actual.getTabKind,
    isPdfDocument: jest.fn(),
    redirectToOriginalPdfUrl: jest.fn(),
    redirectToPdfViewer: jest.fn(),
    updateExtensionIcon: jest.fn(),
    setExtensionUnavailable: jest.fn(),
    getFeedPdfSource: jest.fn(() => 'https://x/a.pdf'),
    getFeedWebSource: jest.fn(() => 'https://example.com'),
  };
});
jest.mock('./isPdfViewer', () => ({ isPdfViewer: (url: string) => url.startsWith('chrome-extension://pundit/pdf-viewer.html') }));
jest.mock('./isFeedWebUrl', () => ({ isFeedWebUrl: (url: string) => url.startsWith('https://feed.example.org/?url=') }));
jest.mock('./isFeedPdfUrl', () => ({ isFeedPdfUrl: (url: string) => url.startsWith('https://feed.example.org/pdf.php') }));
jest.mock('../handlers/onBrowserActionClicked', () => ({ onBrowserActionClicked: jest.fn() }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const sendMessage = jest.fn();
const tabsUpdate = jest.fn();

const run = async (url: string, { active = true, isPdf = false, popup = false } = {}) => {
  (ChromeExtStorage.get as jest.Mock).mockResolvedValue(active);
  (helpers.isPdfDocument as jest.Mock).mockResolvedValue(isPdf);
  (globalThis as any).chrome = {
    runtime: {},
    tabs: {
      get: (_id: number, cb: (tab: object) => void) => cb({ id: 7, url, windowId: 1 }),
      sendMessage,
      update: tabsUpdate,
    },
    windows: { get: (_id: number, cb: (w: object) => void) => cb({ type: popup ? 'popup' : 'normal' }) },
  };
  checkActiveState(7);
  await flush();
  await flush();
};

describe('checkActiveState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMessage.mockResolvedValue(undefined);
  });

  describe('unsupported tabs', () => {
    it.each(['chrome://extensions/?id=abc', 'edge://newtab', 'about:blank', 'https://chromewebstore.google.com/detail/x', ''])(
      '%s: only the unavailable icon',
      async (url) => {
        await run(url);

        expect(helpers.setExtensionUnavailable).toHaveBeenCalledWith(7);
        expect(ChromeExtStorage.get).not.toHaveBeenCalled();
        expect(helpers.isPdfDocument).not.toHaveBeenCalled();
        expect(sendMessage).not.toHaveBeenCalled();
        expect(tabsUpdate).not.toHaveBeenCalled();
        expect(helpers.redirectToPdfViewer).not.toHaveBeenCalled();
        expect(helpers.updateExtensionIcon).not.toHaveBeenCalled();
      }
    );
  });

  describe('web pages', () => {
    it('tell the content script the active state and update the icon', async () => {
      await run('https://example.com/', { active: false });

      expect(sendMessage).toHaveBeenCalledWith(7, expect.objectContaining({ payload: { active: false } }));
      expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, false);
      expect(helpers.setExtensionUnavailable).not.toHaveBeenCalled();
    });

    it('redirect an active PDF to the viewer', async () => {
      await run('https://arxiv.org/pdf/1706.03762', { active: true, isPdf: true });

      expect(helpers.redirectToPdfViewer).toHaveBeenCalledWith('https://arxiv.org/pdf/1706.03762');
      expect(sendMessage).not.toHaveBeenCalled();
      expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, true);
    });

    it('leave an inactive PDF as it is', async () => {
      await run('https://arxiv.org/pdf/1706.03762', { active: false, isPdf: true });

      expect(helpers.redirectToPdfViewer).not.toHaveBeenCalled();
      expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, false);
    });

    it('handle a message without receiver', async () => {
      const result = { catch: jest.fn() };
      sendMessage.mockReturnValue(result);

      await run('https://example.com/');

      expect(result.catch).toHaveBeenCalledTimes(1);
      const [onRejected] = result.catch.mock.calls[0];
      expect(() => onRejected(new Error('Receiving end does not exist.'))).not.toThrow();
    });
  });

  describe('viewer', () => {
    it('sends no message to an active viewer', async () => {
      await run(VIEWER, { active: true });

      expect(sendMessage).not.toHaveBeenCalled();
      expect(helpers.redirectToOriginalPdfUrl).not.toHaveBeenCalled();
      expect(helpers.isPdfDocument).not.toHaveBeenCalled();
      expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, true);
    });

    it('sends an inactive viewer back to the original PDF', async () => {
      await run(VIEWER, { active: false });

      expect(helpers.redirectToOriginalPdfUrl).toHaveBeenCalledWith(VIEWER);
      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('feed URLs', () => {
    it('redirect a feed web URL to the page and activate Pundit', async () => {
      await run(FEED_WEB, { active: false });
      // the click is triggered on the next tick
      await flush();

      expect(tabsUpdate).toHaveBeenCalledWith({ url: 'https://example.com' });
      expect(onBrowserActionClicked).toHaveBeenCalled();
      expect(helpers.updateExtensionIcon).not.toHaveBeenCalled();
    });

    it('redirect a feed PDF URL to the viewer', async () => {
      await run(FEED_PDF, { active: true, isPdf: true });

      expect(helpers.redirectToPdfViewer).toHaveBeenCalledWith('https://x/a.pdf');
      expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, true);
    });
  });

  it('ignores popup windows', async () => {
    await run('https://example.com/', { popup: true });

    expect(helpers.setExtensionUnavailable).not.toHaveBeenCalled();
    expect(helpers.updateExtensionIcon).not.toHaveBeenCalled();
  });
});
