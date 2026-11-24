import { ChromeExtStorage } from '../storage';
import { hasApiAccess, openSiteAccessTab } from './apiAccess';

jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn() } }));

describe('background api access', () => {
  let chromeMock: any;

  beforeAll(() => {
    (globalThis as any).API_BASE_URL = 'https://app.build.org/api';
  });

  beforeEach(() => {
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

  it('checks the origin of the stored application URL', async () => {
    (ChromeExtStorage.get as jest.Mock).mockResolvedValue('https://app.example.org/');

    await expect(hasApiAccess()).resolves.toBe(false);
    expect(chromeMock.permissions.contains).toHaveBeenCalledWith({ origins: ['https://app.example.org/*'] });
  });

  it('falls back to the build API URL before any page stored one', async () => {
    (ChromeExtStorage.get as jest.Mock).mockResolvedValue(undefined);

    await hasApiAccess();
    expect(chromeMock.permissions.contains).toHaveBeenCalledWith({ origins: ['https://app.build.org/*'] });
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
