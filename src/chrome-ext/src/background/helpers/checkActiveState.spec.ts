import { ChromeExtStorage } from '../storage';
import { checkActiveState } from './checkActiveState';
import * as helpers from '.';

jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn() } }));
jest.mock('.', () => ({
  isPdfDocument: jest.fn(),
  isPdfViewer: jest.fn(),
  isFeedPdfUrl: jest.fn(() => false),
  isFeedWebUrl: jest.fn(() => false),
  redirectToOriginalPdfUrl: jest.fn(),
  redirectToPdfViewer: jest.fn(),
  updateExtensionIcon: jest.fn(),
  getFeedPdfSource: jest.fn(),
  getFeedWebSource: jest.fn(),
}));
jest.mock('../handlers/onBrowserActionClicked', () => ({ onBrowserActionClicked: jest.fn() }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const sendMessage = jest.fn();
const VIEWER = 'chrome-extension://id/pdf-viewer.html?source=x';

const run = async (url: string, { active = true, isViewer = false } = {}) => {
  (ChromeExtStorage.get as jest.Mock).mockResolvedValue(active);
  (helpers.isPdfViewer as jest.Mock).mockReturnValue(isViewer);
  (helpers.isPdfDocument as jest.Mock).mockResolvedValue(false);
  (globalThis as any).chrome = {
    runtime: {},
    tabs: { get: (_id: number, cb: (tab: object) => void) => cb({ url, windowId: 1 }), sendMessage },
    windows: { get: (_id: number, cb: (w: object) => void) => cb({ type: 'normal' }) },
  };
  checkActiveState(7);
  await flush();
};

describe('checkActiveState state message', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMessage.mockResolvedValue(undefined);
  });

  it('tells the content script of a web page the active state', async () => {
    await run('https://example.com/');

    expect(sendMessage).toHaveBeenCalledWith(7, expect.objectContaining({ payload: { active: true } }));
    expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, true);
  });

  it('sends nothing to the PDF viewer, which has no content script', async () => {
    await run(VIEWER, { isViewer: true });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(helpers.updateExtensionIcon).toHaveBeenCalledWith(7, true);
  });

  it('still sends an inactive viewer back to the original PDF', async () => {
    await run(VIEWER, { active: false, isViewer: true });

    expect(helpers.redirectToOriginalPdfUrl).toHaveBeenCalledWith(VIEWER);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('handles a message without receiver', async () => {
    const result = { catch: jest.fn() };
    sendMessage.mockReturnValue(result);

    await run('https://example.com/');

    expect(result.catch).toHaveBeenCalledTimes(1);
    const [onRejected] = result.catch.mock.calls[0];
    expect(() => onRejected(new Error('Receiving end does not exist.'))).not.toThrow();
  });
});
