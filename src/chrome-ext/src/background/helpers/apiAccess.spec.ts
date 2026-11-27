import { ChromeExtStorage } from '../storage';
import { getApiOrigins, hasApiAccess, openSiteAccessTab } from './apiAccess';

jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn() } }));

describe('background api access', () => {
  let chromeMock: any;

  beforeAll(() => {
    (globalThis as any).AUTH_BASE_URL = 'https://app.build.org/';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    chromeMock = {
      permissions: { contains: jest.fn().mockResolvedValue(false) },
      tabs: {
        get: jest.fn().mockResolvedValue({ id: 7, windowId: 3, index: 4 }),
        create: jest.fn().mockResolvedValue({ id: 9 }),
      },
      runtime: { getURL: (p: string) => `chrome-extension://pundit/${p}` },
    };
    (globalThis as any).chrome = chromeMock;
  });

  it('checks the origin of the build auth address, whatever the storage holds (design D2)', async () => {
    (ChromeExtStorage.get as jest.Mock).mockResolvedValue('https://evil.example.org/');

    await expect(hasApiAccess()).resolves.toBe(false);
    expect(chromeMock.permissions.contains).toHaveBeenCalledWith({ origins: ['https://app.build.org/*'] });
  });

  it('gives the origin of the build auth address to the site access page', async () => {
    (ChromeExtStorage.get as jest.Mock).mockResolvedValue('https://evil.example.org/');

    await expect(getApiOrigins()).resolves.toEqual(['https://app.build.org/*']);
    expect(ChromeExtStorage.get).not.toHaveBeenCalled();
  });

  it('opens the site access page in a new tab right after the sender tab', async () => {
    await expect(openSiteAccessTab(7)).resolves.toBeNull();

    expect(chromeMock.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://pundit/site-access.html?tab=7',
      windowId: 3,
      index: 5,
      openerTabId: 7,
    });
  });

  it('opens the page without a tab to reload when the sender is unknown', async () => {
    await openSiteAccessTab(undefined);

    expect(chromeMock.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://pundit/site-access.html' });
  });
});
