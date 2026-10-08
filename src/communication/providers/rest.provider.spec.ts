import axios, { AxiosError } from 'axios';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import request$, { retry$ } from './rest.provider';
import { AuthToken } from '../model';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const token: AuthToken = { access_token: 'abc', expires_in: 3600, token_type: 'bearer' };

describe('rest.provider request$', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    axiosMock.mockResolvedValue({ data: 'ok' });
    CommunicationSettings.token = null;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('sends the Bearer token through the fetch adapter', async () => {
    CommunicationSettings.token = token;

    await request$('/notebook', { method: 'get', baseURL: 'http://api' });

    expect(axiosMock).toHaveBeenCalledWith({
      url: '/notebook',
      method: 'get',
      baseURL: 'http://api',
      headers: { Authorization: 'Bearer abc' },
      adapter: fetchAdapter,
    });
  });

  it('sends no Authorization header without a token', async () => {
    await request$('/notebook', { method: 'get' });

    expect(axiosMock.mock.calls[0][0].headers).toBeUndefined();
  });

  it('sends no Authorization header with skipAuth', async () => {
    CommunicationSettings.token = token;

    await request$('/notebook', { method: 'get', skipAuth: true });

    expect(axiosMock.mock.calls[0][0].headers).toBeUndefined();
  });

  it('waits for an in-flight SSO before sending', async () => {
    let releaseSso!: () => void;
    ConnectionManager.ssoLoading$ = new Promise<void>((resolve) => { releaseSso = resolve; });

    const pending = request$('/notebook', { method: 'get' });
    await flush();
    expect(axiosMock).not.toHaveBeenCalled();

    releaseSso();
    await pending;
    expect(axiosMock).toHaveBeenCalledTimes(1);
  });

  it('does not block the SSO request on its own gate', async () => {
    const gate = new Promise<void>(() => undefined);
    ConnectionManager.ssoLoading$ = gate;

    await request$('/api/auth/me', { method: 'post', data: null }, gate);

    expect(axiosMock).toHaveBeenCalledTimes(1);
  });

  it('passes the response promise to the after hook and returns its result', async () => {
    const axiosPromise = Promise.resolve({ data: 'raw' });
    axiosMock.mockReturnValue(axiosPromise);
    const hooked = { data: 'hooked' };
    const after = jest.fn().mockResolvedValue(hooked);

    const result = await request$('/notebook', { method: 'get', hooks: { after } });

    expect(after).toHaveBeenCalledWith(axiosPromise);
    expect(result).toBe(hooked);
  });
});

describe('rest.provider retry$', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    axiosMock.mockResolvedValue({ data: 'ok' });
    CommunicationSettings.token = null;
  });

  it('re-sends the failed config with the current token', async () => {
    CommunicationSettings.token = { ...token, access_token: 'fresh' };
    const error = { config: { url: '/notebook', headers: { 'X-Test': '1' } } } as unknown as AxiosError;

    await retry$(error);

    expect(axiosMock).toHaveBeenCalledWith({
      url: '/notebook',
      headers: { 'X-Test': '1', Authorization: 'Bearer fresh' },
    });
  });

  it('re-sends the failed config unchanged without a token', async () => {
    const config = { url: '/notebook', headers: { 'X-Test': '1' } };

    await retry$({ config } as unknown as AxiosError);

    expect(axiosMock).toHaveBeenCalledWith({ url: '/notebook', headers: { 'X-Test': '1' } });
  });
});
