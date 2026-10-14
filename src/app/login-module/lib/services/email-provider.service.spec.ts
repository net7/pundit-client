import { TestBed } from '@angular/core/testing';
import { EMPTY, firstValueFrom } from 'rxjs';
import { AnalyticsAction } from 'src/common/types';
import { AnalyticsModel, AuthModel } from '../../../../common/models';
import { TermsParameters } from '../interfaces';
import { AuthEventService } from './auth-event.service';
import { LoginConfigurationService } from './configuration.service';
import { EmailProviderService } from './email-provider.service';
import { PopupService } from './popup.service';

jest.mock('../../../../common/models', () => ({
  AuthModel: {
    login: jest.fn(), signup: jest.fn(), resendVerificationMail: jest.fn(), logout: jest.fn(),
  },
  AnalyticsModel: { track: jest.fn() },
}));

const loginMock = AuthModel.login as jest.Mock;
const signupMock = AuthModel.signup as jest.Mock;
const resendMock = AuthModel.resendVerificationMail as jest.Mock;
const logoutMock = AuthModel.logout as jest.Mock;
const trackMock = AnalyticsModel.track as jest.Mock;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const httpError = (status: number, data?: object) => ({ response: { status, data } });

/**
 * Whether `value` is reachable from `root` through own properties
 * (cycles and functions are skipped). Used to check that credentials are dropped.
 */
const holdsValue = (root: unknown, value: string): boolean => {
  const seen = new Set<unknown>();
  const visit = (node: unknown): boolean => {
    if (node === value) { return true; }
    if (!node || typeof node !== 'object' || seen.has(node)) { return false; }
    seen.add(node);
    return Object.values(node).some(visit);
  };
  return visit(root);
};

const credentials = { email: 'user@example.org', password: 'secret-password' };
const terms: TermsParameters = { url: 'http://terms', popup: { origin: '' } };
const registerForm = {
  firstname: 'Ada', lastname: 'Lovelace', ...credentials, termsconditions: true, tracking: false,
};
const loginSuccess = {
  data: { access_token: 't', expires_in: 60, userinfo: { id: '1' } },
};

describe('EmailProviderService', () => {
  let service: EmailProviderService;
  let authEventService: { set: jest.Mock };
  let popupService: { open: jest.Mock };
  let errors: unknown[];
  let loading: boolean[];
  let mustVerify: number;
  let events: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    authEventService = { set: jest.fn() };
    popupService = { open: jest.fn(() => EMPTY) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthEventService, useValue: authEventService },
        { provide: PopupService, useValue: popupService },
        { provide: LoginConfigurationService, useValue: { getTermsParams: () => terms } },
      ],
    });
    service = TestBed.inject(EmailProviderService);
    errors = [];
    loading = [];
    mustVerify = 0;
    service.error$.subscribe((e) => errors.push(e));
    service.isLoading$.subscribe((v) => loading.push(v));
    service.mustVerifyEmail$.subscribe(() => { mustVerify += 1; });
    events = [];
    service.mustVerifyEmail$.subscribe(() => events.push('mustVerifyEmail'));
    service.isLoading$.subscribe((v) => events.push(`isLoading:${v}`));
  });

  describe('register', () => {
    it('treats 422 must_verify_email as an accepted registration', async () => {
      signupMock.mockRejectedValue(httpError(422, { error: 'must_verify_email' }));

      service.register(registerForm);
      await flush();

      expect(mustVerify).toBe(1);
      expect(errors).toEqual([]);
      expect(loading).toEqual([true, false]);
      expect(authEventService.set).not.toHaveBeenCalled();
      expect(trackMock).not.toHaveBeenCalledWith(expect.objectContaining({
        action: AnalyticsAction.RegisterEmailCompleted,
      }));
    });

    it.each([409, 429, 500])('keeps reporting %s as an error', async (status) => {
      signupMock.mockRejectedValue(httpError(status, { error: 'x' }));

      service.register(registerForm);
      await flush();

      expect(errors).toEqual([{ status, data: { error: 'x' } }]);
      expect(mustVerify).toBe(0);
      expect(authEventService.set).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('asks to confirm the email on 422 must_verify_email, without popup', async () => {
      loginMock.mockRejectedValue(httpError(422, { error: 'must_verify_email' }));

      service.login(credentials, terms);
      await flush();

      expect(mustVerify).toBe(1);
      expect(errors).toEqual([]);
      expect(loading).toEqual([true, false]);
      // the notice gets the credentials before the request is marked as settled
      expect(events).toEqual(['isLoading:true', 'mustVerifyEmail', 'isLoading:false']);
      expect(popupService.open).not.toHaveBeenCalled();
      expect(authEventService.set).not.toHaveBeenCalled();
    });

    it('keeps reporting 401 as an error', async () => {
      loginMock.mockRejectedValue(httpError(401, { error: 'Unauthorized' }));

      service.login(credentials, terms);
      await flush();

      expect(errors).toEqual([{ status: 401, data: { error: 'Unauthorized' } }]);
      expect(mustVerify).toBe(0);
    });

    it('keeps reporting 422 must_accept_terms as before', async () => {
      loginMock.mockRejectedValue(httpError(422, { error: 'must_accept_terms' }));

      service.login(credentials, terms);
      await flush();

      expect(mustVerify).toBe(0);
      expect(errors).toEqual([{ status: 422, data: { error: 'must_accept_terms' } }]);
    });
  });

  describe('resendVerificationMail', () => {
    const resend = () => firstValueFrom(service.resendVerificationMail(credentials));

    it('sends email and password and reports a sent link on 202', async () => {
      resendMock.mockResolvedValue({ status: 202, data: '' });

      await expect(resend()).resolves.toEqual({ kind: 'sent' });
      expect(resendMock).toHaveBeenCalledWith(credentials);
    });

    it('reports the retry time on 429 verification_mail_throttled', async () => {
      resendMock.mockRejectedValue(httpError(429, { error: 'verification_mail_throttled', retry_after_minutes: 15 }));

      await expect(resend()).resolves.toEqual({ kind: 'throttled', minutes: 15 });
    });

    it('reports too many attempts on 429 without body', async () => {
      resendMock.mockRejectedValue(httpError(429));

      await expect(resend()).resolves.toEqual({ kind: 'too_many_attempts' });
    });

    it('reports wrong credentials on 401', async () => {
      resendMock.mockRejectedValue(httpError(401, { error: 'Unauthorized' }));

      await expect(resend()).resolves.toEqual({ kind: 'wrong_credentials' });
      expect(loginMock).not.toHaveBeenCalled();
    });

    it('starts the normal login with the same credentials on 409 already_verified', async () => {
      resendMock.mockRejectedValue(httpError(409, { error: 'already_verified' }));
      loginMock.mockResolvedValue(loginSuccess);

      await expect(resend()).resolves.toEqual({ kind: 'already_verified' });
      await flush();

      expect(loginMock).toHaveBeenCalledWith(credentials);
      expect(authEventService.set).toHaveBeenCalled();
    });

    it('reports a generic error otherwise', async () => {
      resendMock.mockRejectedValue(httpError(500));

      await expect(resend()).resolves.toEqual({ kind: 'error' });
    });

    it('keeps no reference to the credentials', async () => {
      resendMock.mockResolvedValue({ status: 202, data: '' });
      loginMock.mockRejectedValue(httpError(422, { error: 'must_verify_email' }));

      service.login(credentials, terms);
      await resend();
      await flush();

      expect(holdsValue(service, credentials.password)).toBe(false);
    });
  });

  describe('signOut', () => {
    it('closes the web session and completes, also when the request fails', async () => {
      logoutMock.mockResolvedValueOnce({ data: null }).mockRejectedValueOnce(httpError(500));

      await expect(firstValueFrom(service.signOut())).resolves.toBeUndefined();
      await expect(firstValueFrom(service.signOut())).resolves.toBeUndefined();
      expect(logoutMock).toHaveBeenCalledTimes(2);
    });
  });
});
