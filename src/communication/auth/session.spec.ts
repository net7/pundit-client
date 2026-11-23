import axios from 'axios';
import sso from './session';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const userinfo = { id: '01HX', username: 'Ada', current_notebook: 'nb' };

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const trackRelease = (gate: Promise<unknown>) => {
  const state = { released: false };
  gate.then(() => { state.released = true; });
  return state;
};

describe('auth sso (session lookup)', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://app/';
    CommunicationSettings.csrfToken = null;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('asks GET api/user with the session cookie and stores the csrf_token', async () => {
    const response = { data: { userinfo, csrf_token: 'session-token' } };
    axiosMock.mockResolvedValue(response);

    const result = await sso();

    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(axiosMock).toHaveBeenCalledWith(expect.objectContaining({
      url: 'api/user',
      baseURL: 'http://app/',
      method: 'get',
      withCredentials: true,
    }));
    expect(axiosMock.mock.calls[0][0].headers).toEqual({});
    expect(CommunicationSettings.csrfToken).toBe('session-token');
    expect(result).toBe(response);
    expect(result.data.userinfo).toEqual(userinfo);
  });

  it('rethrows a 401 for a guest, with a single request and the token untouched', async () => {
    CommunicationSettings.csrfToken = 'guest-token';
    const error = { response: { status: 401, data: { error: 'Unauthorized' } } };
    axiosMock.mockRejectedValue(error);

    await expect(sso()).rejects.toBe(error);
    await flush();

    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(CommunicationSettings.csrfToken).toBe('guest-token');
  });

  it('holds the ssoLoading$ gate until the request succeeds', async () => {
    const http = deferred<unknown>();
    axiosMock.mockReturnValue(http.promise);

    const pending = sso();
    const gate = trackRelease(ConnectionManager.ssoLoading$);
    await flush();
    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(gate.released).toBe(false);

    http.resolve({ data: { userinfo, csrf_token: 't' } });
    await pending;
    await flush();
    expect(gate.released).toBe(true);
  });

  it('releases the ssoLoading$ gate when the request fails', async () => {
    const http = deferred<unknown>();
    axiosMock.mockReturnValue(http.promise);

    const pending = sso();
    const gate = trackRelease(ConnectionManager.ssoLoading$);
    await flush();
    expect(gate.released).toBe(false);

    http.reject(new Error('sso failed'));
    await expect(pending).rejects.toThrow('sso failed');
    await flush();
    expect(gate.released).toBe(true);
  });
});
