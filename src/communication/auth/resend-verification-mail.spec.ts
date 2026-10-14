import axios from 'axios';
import resendVerificationMail from './resend-verification-mail';
import { AuthToken } from '../model';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const storedToken: AuthToken = { access_token: 'stored', expires_in: 3600, token_type: 'bearer' };
const credentials = { email: 'user@example.org', password: 'secret-password' };

describe('auth resendVerificationMail', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://auth';
    CommunicationSettings.token = storedToken;
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('posts email and password to the auth server without the token', async () => {
    const response = { status: 202, data: '' };
    axiosMock.mockResolvedValue(response);

    const result = await resendVerificationMail(credentials);

    expect(axiosMock).toHaveBeenCalledTimes(1);
    const [options] = axiosMock.mock.calls[0];
    expect(options).toEqual(expect.objectContaining({
      url: 'api/auth/resend_verification_mail',
      baseURL: 'http://auth',
      method: 'post',
      data: credentials,
    }));
    expect(options.headers).toBeUndefined();
    expect(options.hooks).toBeUndefined();
    expect(CommunicationSettings.token).toBe(storedToken);
    expect(result).toBe(response);
  });

  it('rethrows a 401 without refreshing the token', async () => {
    const error = { response: { status: 401, data: { error: 'Unauthorized' } } };
    axiosMock.mockRejectedValue(error);

    await expect(resendVerificationMail(credentials)).rejects.toBe(error);

    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(CommunicationSettings.token).toBe(storedToken);
  });
});
