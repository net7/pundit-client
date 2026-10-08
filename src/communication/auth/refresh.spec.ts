import axios, { AxiosPromise } from 'axios';
import { refreshHook } from './refresh';
import { AuthToken } from '../model';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const staleToken: AuthToken = { access_token: 'stale', expires_in: 3600, token_type: 'bearer' };
const rejectWith = (error: unknown) => Promise.reject(error) as AxiosPromise;
const httpError = (status: number) => ({
  response: { status },
  config: { url: '/notebook', method: 'get', headers: {} },
});

describe('auth refreshHook', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://auth';
    CommunicationSettings.token = staleToken;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('passes successful responses through untouched', async () => {
    const response = { data: 'ok' };

    const result = await refreshHook(Promise.resolve(response) as AxiosPromise);

    expect(result).toBe(response);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  it('refreshes the token on 401 and retries the original request', async () => {
    axiosMock
      .mockResolvedValueOnce({ data: { access_token: 'fresh', expires_in: 60, token_type: 'bearer', extra: 'x' } })
      .mockResolvedValueOnce({ data: 'retried' });

    const result = await refreshHook(rejectWith(httpError(401)));

    expect(axiosMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      url: 'api/auth/refresh',
      baseURL: 'http://auth',
      method: 'post',
      data: null,
      withCredentials: true,
    }));
    expect(CommunicationSettings.token).toEqual({ access_token: 'fresh', expires_in: 60, token_type: 'bearer' });
    expect(axiosMock).toHaveBeenNthCalledWith(2, {
      url: '/notebook',
      method: 'get',
      headers: { Authorization: 'Bearer fresh' },
    });
    expect(result.data).toBe('retried');
  });

  it('clears the token and rethrows when the refresh fails', async () => {
    const refreshError = new Error('refresh failed');
    axiosMock.mockRejectedValueOnce(refreshError);

    await expect(refreshHook(rejectWith(httpError(401)))).rejects.toBe(refreshError);

    expect(CommunicationSettings.token).toBeNull();
  });

  it('rethrows errors with any other status unchanged', async () => {
    const error = httpError(500);

    await expect(refreshHook(rejectWith(error))).rejects.toBe(error);

    expect(axiosMock).not.toHaveBeenCalled();
    expect(CommunicationSettings.token).toBe(staleToken);
  });
});
