import { environment as env } from '../../environments/environment';
import { ExtensionAccessModel } from './extension-access-model';

describe('ExtensionAccessModel', () => {
  const setChrome = (permissions?: object) => {
    (globalThis as any).chrome = permissions ? { permissions } : undefined;
  };

  beforeEach(() => {
    (env as any).authBaseUrl = 'https://app.example.org/';
  });

  afterEach(() => setChrome());

  it('answers true outside the extension', async () => {
    setChrome();

    await expect(ExtensionAccessModel.hasApiAccess()).resolves.toBe(true);
  });

  it('asks the browser for the application origin', async () => {
    const contains = jest.fn().mockResolvedValue(false);
    setChrome({ contains });

    await expect(ExtensionAccessModel.hasApiAccess()).resolves.toBe(false);
    expect(contains).toHaveBeenCalledWith({ origins: ['https://app.example.org/*'] });
  });

  it('answers true when the check itself fails or the URL is unknown', async () => {
    setChrome({ contains: jest.fn().mockRejectedValue(new Error('x')) });
    await expect(ExtensionAccessModel.hasApiAccess()).resolves.toBe(true);

    (env as any).authBaseUrl = undefined;
    setChrome({ contains: jest.fn().mockResolvedValue(false) });
    await expect(ExtensionAccessModel.hasApiAccess()).resolves.toBe(true);
  });

  it('requests the application origin only, and keeps the page when refused', async () => {
    const request = jest.fn().mockResolvedValue(false);
    setChrome({ request });

    await expect(ExtensionAccessModel.requestApiAccess()).resolves.toBe(false);
    expect(request).toHaveBeenCalledWith({ origins: ['https://app.example.org/*'] });
  });

  it('requests nothing outside the extension', async () => {
    setChrome();

    await expect(ExtensionAccessModel.requestApiAccess()).resolves.toBe(false);
  });
});
