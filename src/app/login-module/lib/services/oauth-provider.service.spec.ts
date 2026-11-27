import { TestBed } from '@angular/core/testing';
import { _t, translate } from '@net7/core';
import { Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { AnalyticsModel, AuthModel } from '../../../../common/models';
import { OAuthProvider } from '../interfaces';
import { AuthEventService } from './auth-event.service';
import { OauthProviderService } from './oauth-provider.service';
import { PopupService } from './popup.service';

jest.mock('../../../../common/models', () => ({
  AuthModel: { sso: jest.fn() },
  AnalyticsModel: { track: jest.fn() },
}));

const ssoMock = AuthModel.sso as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const providerFor = (id: string) => ({
  id,
  type: 'OAuth',
  params: { url: `https://app/login/${id}/pundit` },
  popup: { origin: 'https://app' },
} as OAuthProvider);
const provider = providerFor('google');

const outcome = (data: object) => ({ data, origin: 'https://app' } as MessageEvent);

describe('OauthProviderService', () => {
  let service: OauthProviderService;
  let popupEvents: Subject<MessageEvent>;
  let authEventService: { set: jest.Mock };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  let popupService: { open: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    popupEvents = new Subject<MessageEvent>();
    authEventService = { set: jest.fn() };
    popupService = { open: jest.fn(() => popupEvents) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthEventService, useValue: authEventService },
        { provide: PopupService, useValue: popupService },
      ],
    });
    service = TestBed.inject(OauthProviderService);
    service.login(provider);
  });

  it.each(['google', 'facebook', 'egi'])('opens the configured address of %s unchanged (design D5)', (id) => {
    popupService.open.mockClear();
    const chosen = providerFor(id);

    service.login(chosen);

    expect(popupService.open).toHaveBeenCalledWith(`https://app/login/${id}/pundit`, chosen.popup);
  });

  it('shows its own text for already_signed_in and makes no session lookup (design D5)', async () => {
    popupEvents.next(outcome({ source: 'pundit-login', status: 'error', error: 'already_signed_in' }));
    await flush();

    expect(ssoMock).not.toHaveBeenCalled();
    expect(_t('toast#login_already_signed_in_text'))
      .toBe('You are already signed in with another account. Sign out first.');
    expect(authEventService.set).toHaveBeenCalledWith({
      error: _t('toast#login_already_signed_in_text'),
      source: 'login',
    });
  });

  it('asks the session who signed in on status ok, then signs the user in', async () => {
    const user = { id: '01HX', username: 'Ada' };
    ssoMock.mockResolvedValue({ data: { userinfo: user, csrf_token: 't' } });

    popupEvents.next(outcome({ source: 'pundit-login', status: 'ok' }));
    await flush();

    expect(ssoMock).toHaveBeenCalledTimes(1);
    expect(authEventService.set).toHaveBeenCalledWith({ user, source: 'login' });
    expect(AnalyticsModel.track).toHaveBeenCalled();
  });

  it('shows the generic text when the session lookup fails', async () => {
    ssoMock.mockRejectedValue({ response: { status: 401, data: { error: 'Some sentence' } } });

    popupEvents.next(outcome({ source: 'pundit-login', status: 'ok' }));
    await flush();

    expect(authEventService.set).toHaveBeenCalledWith({ error: _t('toast#login_error_text'), source: 'login' });
  });

  it.each(['provider_failed', 'Unauthorized', 'General error', undefined])(
    'shows the generic text for error %s',
    async (error) => {
      popupEvents.next(outcome({ source: 'pundit-login', status: 'error', error }));
      await flush();

      expect(ssoMock).not.toHaveBeenCalled();
      expect(authEventService.set).toHaveBeenCalledWith({ error: _t('toast#login_error_text'), source: 'login' });
    }
  );

  it('shows a readable error sentence as it is', async () => {
    const sentence = 'Your Facebook account does not share an email address.';

    popupEvents.next(outcome({ source: 'pundit-login', status: 'error', error: sentence }));
    await flush();

    expect(authEventService.set).toHaveBeenCalledWith({ error: sentence, source: 'login' });
  });

  it('shows nothing when no message arrives', async () => {
    popupEvents.complete();
    await flush();

    expect(ssoMock).not.toHaveBeenCalled();
    expect(authEventService.set).not.toHaveBeenCalled();
  });
});
