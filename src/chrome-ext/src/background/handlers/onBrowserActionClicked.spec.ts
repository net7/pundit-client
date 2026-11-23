import { ChromeExtStorage } from '../storage';
import * as helpers from '../helpers';
import { onBrowserActionClicked } from './onBrowserActionClicked';

jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() } }));
jest.mock('../helpers', () => ({
  checkActiveState: jest.fn(),
  getTabKind: (url?: string) => (url?.startsWith('https://') ? 'web' : 'unsupported'),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('onBrowserActionClicked', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ChromeExtStorage.get as jest.Mock).mockResolvedValue(undefined);
    (ChromeExtStorage.set as jest.Mock).mockResolvedValue(true);
  });

  it('activates Pundit on a web page', async () => {
    onBrowserActionClicked({ id: 7, url: 'https://example.com/' } as chrome.tabs.Tab);
    await flush();

    expect(ChromeExtStorage.set).toHaveBeenCalledWith('active.7', true);
    expect(helpers.checkActiveState).toHaveBeenCalledWith(7);
  });

  it.each(['chrome://extensions/', undefined])('stores nothing on %s', async (url) => {
    onBrowserActionClicked({ id: 7, url } as chrome.tabs.Tab);
    await flush();

    expect(ChromeExtStorage.get).not.toHaveBeenCalled();
    expect(ChromeExtStorage.set).not.toHaveBeenCalled();
    expect(helpers.checkActiveState).not.toHaveBeenCalled();
  });
});
