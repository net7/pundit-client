import axios from 'axios';
import login from './login';
import logout from './logout';
import signup from './signup';
import setDefault from '../notebook/set-default';
import request$, { CSRF_HEADER } from '../providers/rest.provider';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

type Call = { url: string; method?: string; baseURL?: string; data?: unknown; headers?: Record<string, string> };
const axiosMock = axios as unknown as jest.Mock;
const calls = (): Call[] => axiosMock.mock.calls.map(([config]) => config);
const urls = () => calls().map(({ url }) => url);
const credentials = { email: 'user@example.org', password: 'secret-password' };

/** `GET api/csrf` answers `csrfTokens` in order; other routes answer from `routes` or `{data: null}`. */
const mockBackend = (csrfTokens: string[], routes: Record<string, () => Promise<unknown>> = {}) => {
  const queue = [...csrfTokens];
  axiosMock.mockImplementation((config: Call) => {
    if (config.url === 'api/csrf') {
      return Promise.resolve({ data: { csrf_token: queue.shift() } });
    }
    return routes[config.url] ? routes[config.url]() : Promise.resolve({ data: null });
  });
};

const guestSearch = () => request$('/annotation/search', { baseURL: 'http://app/api', method: 'post', data: {} });

describe('auth routes', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://app/';
    CommunicationSettings.csrfToken = null;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  describe('login', () => {
    it('posts to api/auth/login with a CSRF token and stores the token it answers', async () => {
      mockBackend(['guest-token'], {
        'api/auth/login': () => Promise.resolve({ data: { userinfo: { id: '1' }, csrf_token: 'login-token' } }),
      });

      await login(credentials);

      expect(urls()).toEqual(['api/csrf', 'api/auth/login']);
      expect(calls()[1]).toEqual(expect.objectContaining({
        baseURL: 'http://app/', method: 'post', data: credentials, headers: { [CSRF_HEADER]: 'guest-token' },
      }));
      expect(CommunicationSettings.csrfToken).toBe('login-token');
    });

    it('sends the next write with the login token, without fetching one', async () => {
      mockBackend(['guest-token'], {
        'api/auth/login': () => Promise.resolve({ data: { userinfo: { id: '1' }, csrf_token: 'login-token' } }),
      });
      await login(credentials);
      axiosMock.mockClear();

      await guestSearch();

      expect(urls()).toEqual(['/annotation/search']);
      expect(calls()[0].headers).toEqual({ [CSRF_HEADER]: 'login-token' });
    });

    it('rethrows a login error and keeps the stored token', async () => {
      CommunicationSettings.csrfToken = 'guest-token';
      const error = { response: { status: 422, data: { error: 'must_verify_email' } } };
      mockBackend([], { 'api/auth/login': () => Promise.reject(error) });

      await expect(login(credentials)).rejects.toBe(error);

      expect(CommunicationSettings.csrfToken).toBe('guest-token');
    });
  });

  describe('signup', () => {
    it('posts to api/user/register with the CSRF token', async () => {
      CommunicationSettings.csrfToken = 'guest-token';
      const error = { response: { status: 422, data: { error: 'must_verify_email' } } };
      mockBackend([], { 'api/user/register': () => Promise.reject(error) });

      await expect(signup({
        first_name: 'Ada', last_name: 'Lovelace', ...credentials, terms: true, tracking: false,
      })).rejects.toBe(error);

      expect(calls()[0]).toEqual(expect.objectContaining({
        url: 'api/user/register', method: 'post', headers: { [CSRF_HEADER]: 'guest-token' },
      }));
    });
  });

  describe('logout', () => {
    it('posts to api/auth/logout and clears the stored token', async () => {
      CommunicationSettings.csrfToken = 'session-token';
      mockBackend([]);

      await logout();

      expect(calls()[0]).toEqual(expect.objectContaining({
        url: 'api/auth/logout', baseURL: 'http://app/', method: 'post', headers: { [CSRF_HEADER]: 'session-token' },
      }));
      expect(CommunicationSettings.csrfToken).toBeNull();
    });

    it('clears the stored token also when the request fails', async () => {
      CommunicationSettings.csrfToken = 'session-token';
      const error = { response: { status: 500 } };
      mockBackend([], { 'api/auth/logout': () => Promise.reject(error) });

      await expect(logout()).rejects.toBe(error);

      expect(CommunicationSettings.csrfToken).toBeNull();
    });

    it('makes the next write fetch a new token', async () => {
      CommunicationSettings.csrfToken = 'session-token';
      mockBackend(['guest-token']);
      await logout();
      axiosMock.mockClear();

      await guestSearch();

      expect(urls()).toEqual(['api/csrf', '/annotation/search']);
      expect(calls()[1].headers).toEqual({ [CSRF_HEADER]: 'guest-token' });
    });
  });

  describe('setDefault', () => {
    it('posts to api/auth/edit_current_notebook/{id}', async () => {
      CommunicationSettings.csrfToken = 'session-token';
      mockBackend([]);

      await setDefault('01HXNOTEBOOK');

      expect(calls()[0]).toEqual(expect.objectContaining({
        url: 'api/auth/edit_current_notebook/01HXNOTEBOOK', baseURL: 'http://app/', method: 'post',
      }));
    });
  });
});
