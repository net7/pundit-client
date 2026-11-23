import axios from 'axios';
import resendVerificationMail from './resend-verification-mail';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';

jest.mock('axios', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@vespaiach/axios-fetch-adapter', () => ({ __esModule: true, default: jest.fn() }));

const axiosMock = axios as unknown as jest.Mock;
const credentials = { email: 'user@example.org', password: 'secret-password' };

describe('auth resendVerificationMail', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    CommunicationSettings.authBaseUrl = 'http://app/';
    CommunicationSettings.csrfToken = 'stored';
    ConnectionManager.ssoLoading$ = Promise.resolve();
  });

  it('posts email and password to the auth routes with the CSRF token', async () => {
    const response = { status: 202, data: '' };
    axiosMock.mockResolvedValue(response);

    const result = await resendVerificationMail(credentials);

    expect(axiosMock).toHaveBeenCalledTimes(1);
    const [options] = axiosMock.mock.calls[0];
    expect(options).toEqual(expect.objectContaining({
      url: 'api/auth/resend_verification_mail',
      baseURL: 'http://app/',
      method: 'post',
      data: credentials,
      withCredentials: true,
      headers: { 'X-CSRF-TOKEN': 'stored' },
    }));
    expect(CommunicationSettings.csrfToken).toBe('stored');
    expect(result).toBe(response);
  });

  it('rethrows a 401 with a single request', async () => {
    const error = { response: { status: 401, data: { error: 'Unauthorized' } } };
    axiosMock.mockRejectedValue(error);

    await expect(resendVerificationMail(credentials)).rejects.toBe(error);

    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(CommunicationSettings.csrfToken).toBe('stored');
  });
});
