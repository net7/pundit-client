import axios from 'axios';
import sso from './sso';
import { AuthToken } from '../model';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const staleToken: AuthToken = { access_token: 'stale', expires_in: 3600, token_type: 'bearer' };

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

describe('auth sso', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://auth';
    CommunicationSettings.token = null;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('calls /api/auth/me and stores the returned token', async () => {
    const response = { data: { access_token: 'sso', expires_in: 60, token_type: 'bearer', userinfo: {} } };
    axiosMock.mockResolvedValue(response);

    const result = await sso();

    expect(axiosMock).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/auth/me',
      baseURL: 'http://auth',
      method: 'post',
      data: null,
      withCredentials: true,
    }));
    expect(CommunicationSettings.token).toEqual({ access_token: 'sso', expires_in: 60, token_type: 'bearer' });
    expect(result).toBe(response);
  });

  it('clears the token and rethrows on failure', async () => {
    CommunicationSettings.token = staleToken;
    const error = new Error('sso failed');
    axiosMock.mockRejectedValue(error);

    await expect(sso()).rejects.toBe(error);

    expect(CommunicationSettings.token).toBeNull();
  });

  it('holds the ssoLoading$ gate until the request succeeds', async () => {
    const http = deferred<unknown>();
    axiosMock.mockReturnValue(http.promise);

    const pending = sso();
    const gate = trackRelease(ConnectionManager.ssoLoading$);
    await flush();
    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(gate.released).toBe(false);

    http.resolve({ data: { access_token: 'sso', expires_in: 60, token_type: 'bearer' } });
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
