import axios, { AxiosError } from 'axios';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import request$, { CSRF_HEADER, retry$ } from './rest.provider';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

type Call = { url: string; method?: string; headers?: Record<string, string>; withCredentials?: boolean };
const calls = (): Call[] => axiosMock.mock.calls.map(([config]) => config);
const csrfCalls = () => calls().filter(({ url }) => url === 'api/csrf');
const apiCalls = () => calls().filter(({ url }) => url !== 'api/csrf');
const csrfError = () => ({ response: { status: 419, data: { message: 'CSRF token mismatch.' } } });

/** axios mock: `GET api/csrf` answers `tokens` in order, any other call `handler`. */
const mockBackend = (
  tokens: string[],
  handler: (config: Call) => Promise<unknown> = () => Promise.resolve({ data: 'ok' })
) => {
  const queue = [...tokens];
  axiosMock.mockImplementation((config: Call) => (config.url === 'api/csrf'
    ? Promise.resolve({ data: { csrf_token: queue.shift() } })
    : handler(config)));
};

describe('rest.provider request$', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    mockBackend(['fetched']);
    CommunicationSettings.csrfToken = null;
    CommunicationSettings.authBaseUrl = 'http://app/';
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  describe('credentials', () => {
    it('sends the session cookie through the fetch adapter, without Authorization', async () => {
      await request$('/notebook', { method: 'get', baseURL: 'http://api' });

      expect(axiosMock).toHaveBeenCalledWith({
        url: '/notebook',
        method: 'get',
        baseURL: 'http://api',
        headers: {},
        withCredentials: true,
        adapter: fetchAdapter,
      });
    });

    it('never sends an Authorization header on a write', async () => {
      CommunicationSettings.csrfToken = 'stored';

      await request$('/annotation', { method: 'post', data: { a: 1 } });

      const [call] = apiCalls();
      expect(call.withCredentials).toBe(true);
      expect(call.headers).not.toHaveProperty('Authorization');
    });

    it('sends an anonymous request without cookies and without CSRF header', async () => {
      CommunicationSettings.csrfToken = 'stored';

      await request$('/annotation/search', { method: 'post', data: {}, anonymous: true });

      expect(calls()).toHaveLength(1);
      const [call] = calls();
      expect(call.withCredentials).toBe(false);
      expect(call.headers).not.toHaveProperty(CSRF_HEADER);
      expect(call).not.toHaveProperty('anonymous');
    });

    it('does not pass the hooks to axios', async () => {
      await request$('/notebook', { method: 'get', hooks: { after: (r) => r } });

      expect(calls()[0]).not.toHaveProperty('hooks');
    });
  });

  describe('CSRF token', () => {
    it('sends no CSRF header on a GET and fetches no token', async () => {
      await request$('/notebook', { method: 'get' });

      expect(csrfCalls()).toHaveLength(0);
      expect(calls()[0].headers).not.toHaveProperty(CSRF_HEADER);
    });

    it('treats a request without method as a GET', async () => {
      await request$('/notebook', {});

      expect(csrfCalls()).toHaveLength(0);
    });

    it('sends the stored token on a write without fetching one', async () => {
      CommunicationSettings.csrfToken = 'stored';

      await request$('/annotation', { method: 'put', data: {} });

      expect(csrfCalls()).toHaveLength(0);
      expect(apiCalls()[0].headers).toEqual({ [CSRF_HEADER]: 'stored' });
    });

    it('fetches a token from GET api/csrf before the first write and stores it', async () => {
      await request$('/annotation', { method: 'post', data: {} });

      expect(calls().map(({ url }) => url)).toEqual(['api/csrf', '/annotation']);
      expect(csrfCalls()[0]).toEqual(expect.objectContaining({
        baseURL: 'http://app/', method: 'get', withCredentials: true,
      }));
      expect(apiCalls()[0].headers).toEqual({ [CSRF_HEADER]: 'fetched' });
      expect(CommunicationSettings.csrfToken).toBe('fetched');
    });

    it('keeps the caller headers next to the CSRF header', async () => {
      CommunicationSettings.csrfToken = 'stored';

      await request$('/annotation', { method: 'delete', headers: { 'X-Test': '1' } });

      expect(apiCalls()[0].headers).toEqual({ 'X-Test': '1', [CSRF_HEADER]: 'stored' });
    });

    it('shares one GET api/csrf between two concurrent writes', async () => {
      await Promise.all([
        request$('/annotation', { method: 'post', data: {} }),
        request$('/notebook', { method: 'delete' }),
      ]);

      expect(csrfCalls()).toHaveLength(1);
      expect(apiCalls().map(({ headers }) => headers?.[CSRF_HEADER])).toEqual(['fetched', 'fetched']);
    });

    it('fetches again once the token is dropped', async () => {
      mockBackend(['first', 'second']);
      await request$('/annotation', { method: 'post', data: {} });
      CommunicationSettings.csrfToken = null;

      await request$('/annotation', { method: 'post', data: {} });

      expect(csrfCalls()).toHaveLength(2);
      expect(apiCalls()[1].headers).toEqual({ [CSRF_HEADER]: 'second' });
    });
  });

  describe('419', () => {
    it('renews the token and retries once', async () => {
      CommunicationSettings.csrfToken = 'stale';
      let attempts = 0;
      mockBackend(['fresh'], () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(csrfError()) : Promise.resolve({ data: 'saved' });
      });

      const result = await request$('/annotation', { method: 'post', data: {} });

      expect(result).toEqual({ data: 'saved' });
      expect(calls().map(({ url }) => url)).toEqual(['/annotation', 'api/csrf', '/annotation']);
      expect(apiCalls().map(({ headers }) => headers?.[CSRF_HEADER])).toEqual(['stale', 'fresh']);
      expect(CommunicationSettings.csrfToken).toBe('fresh');
    });

    it('rethrows a second 419 without a third attempt', async () => {
      CommunicationSettings.csrfToken = 'stale';
      const error = csrfError();
      mockBackend(['fresh'], () => Promise.reject(error));

      await expect(request$('/annotation', { method: 'post', data: {} })).rejects.toBe(error);

      expect(apiCalls()).toHaveLength(2);
      expect(csrfCalls()).toHaveLength(1);
    });

    it('does not retry an anonymous request', async () => {
      const error = csrfError();
      mockBackend([], () => Promise.reject(error));

      await expect(request$('/annotation/search', { method: 'post', data: {}, anonymous: true }))
        .rejects.toBe(error);

      expect(calls()).toHaveLength(1);
      expect(CommunicationSettings.csrfToken).toBeNull();
    });

    it('rethrows other statuses unchanged', async () => {
      CommunicationSettings.csrfToken = 'stored';
      const error = { response: { status: 401 } };
      mockBackend([], () => Promise.reject(error));

      await expect(request$('/annotation', { method: 'post', data: {} })).rejects.toBe(error);

      expect(calls()).toHaveLength(1);
    });
  });

  describe('session lookup gate', () => {
    it('waits for an in-flight session lookup before sending', async () => {
      let releaseSso!: () => void;
      ConnectionManager.ssoLoading$ = new Promise<void>((resolve) => { releaseSso = resolve; });

      const pending = request$('/notebook', { method: 'get' });
      await flush();
      expect(axiosMock).not.toHaveBeenCalled();

      releaseSso();
      await pending;
      expect(axiosMock).toHaveBeenCalledTimes(1);
    });

    it('does not block the session lookup on its own gate', async () => {
      const gate = new Promise<void>(() => undefined);
      ConnectionManager.ssoLoading$ = gate;

      await request$('api/user', { method: 'get' }, gate);

      expect(axiosMock).toHaveBeenCalledTimes(1);
    });
  });

  it('passes the response promise to the after hook and returns its result', async () => {
    const hooked = { data: 'hooked' };
    const after = jest.fn((response: Promise<unknown>) => response.then(() => hooked));

    const result = await request$('/notebook', { method: 'get', hooks: { after: after as any } });

    expect(after).toHaveBeenCalledTimes(1);
    await expect(after.mock.calls[0][0]).resolves.toEqual({ data: 'ok' });
    expect(result).toBe(hooked);
  });
});

describe('rest.provider retry$', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    axiosMock.mockResolvedValue({ data: 'ok' });
  });

  it('re-sends the failed request config', async () => {
    const config = { url: '/notebook', headers: { 'X-Test': '1' } };

    await retry$({ config } as unknown as AxiosError);

    expect(axiosMock).toHaveBeenCalledWith(config);
  });
});
