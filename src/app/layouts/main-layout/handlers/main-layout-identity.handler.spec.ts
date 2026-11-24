import { translate } from '@net7/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { getEventType, MainLayoutEvent } from 'src/app/event-types';
import { ExtensionAccessModel } from 'src/common/models';
import { MainLayoutIdentityHandler } from './main-layout-identity.handler';

describe('MainLayoutIdentityHandler > active AI key flag', () => {
  let innerEvents$: Subject<{ type: string; payload?: any }>;
  let layoutDS: any;
  let layoutEH: any;

  const userResponse = (extra: object = {}) => ({
    user: {
      id: '1', username: 'user', thumb: '', is_verified: true, current_notebook: 'nb', ...extra,
    },
  });

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  const listen = (initResponse: any) => {
    innerEvents$ = new Subject();
    layoutDS = {
      state: { hasActiveAiKey: null },
      hasLoaded$: new BehaviorSubject(false),
      punditLoginService: { sso: jest.fn(() => of(initResponse)), stop: jest.fn() },
      userService: {
        iam: jest.fn(),
        whoami: jest.fn(() => ({ id: '1' })),
        dashboardNotifications$: new Subject(),
      },
      notebookService: { setSelected: jest.fn() },
      toastService: { warn: jest.fn(), success: jest.fn(), error: jest.fn(), clear: jest.fn() },
    };
    layoutEH = { innerEvents$, appEvent$: new Subject(), emitInner: jest.fn() };
    new MainLayoutIdentityHandler(layoutDS, layoutEH).listen();
  };

  it.each([true, false])('stores has_active_ai_key = %s from the SSO response', (value) => {
    listen(userResponse({ has_active_ai_key: value }));

    expect(layoutDS.state.hasActiveAiKey).toBe(value);
  });

  it('stores null when the backend does not send the flag', () => {
    listen(userResponse());

    expect(layoutDS.state.hasActiveAiKey).toBeNull();
  });

  it('stores null when the user is not logged in', () => {
    listen({ error: 'Unauthorized' });

    expect(layoutDS.state.hasActiveAiKey).toBeNull();
  });

  it('updates the flag on identity sync (window focus)', () => {
    listen(userResponse({ has_active_ai_key: false }));
    layoutDS.punditLoginService.sso.mockReturnValue(of(userResponse({ has_active_ai_key: true })));

    innerEvents$.next({ type: MainLayoutEvent.IdentitySync });

    expect(layoutDS.state.hasActiveAiKey).toBe(true);
  });

  it('treats an SSO 401 Unauthorized as logged out, with a single request', () => {
    listen({ error: 'Unauthorized' });

    expect(layoutDS.punditLoginService.sso).toHaveBeenCalledTimes(1);
    expect(layoutDS.userService.iam).not.toHaveBeenCalled();
    expect(layoutEH.emitInner).toHaveBeenCalledWith(getEventType(MainLayoutEvent.GetPublicData));
  });

  it('goes on as a guest when the session lookup fails for another reason', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    listen({ error: 'Internal server error' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(layoutDS.userService.iam).not.toHaveBeenCalled();
    expect(layoutDS.toastService.error).toHaveBeenCalledTimes(1);
    expect(layoutDS.toastService.warn).not.toHaveBeenCalled();
    expect(layoutEH.emitInner).toHaveBeenCalledWith(getEventType(MainLayoutEvent.GetPublicData));
  });

  describe('site access', () => {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('offers to allow access when the extension cannot reach the application', async () => {
      jest.spyOn(ExtensionAccessModel, 'hasApiAccess').mockResolvedValue(false);
      const request = jest.spyOn(ExtensionAccessModel, 'requestApiAccess').mockResolvedValue(true);

      listen({ error: 'Internal server error' });
      await flush();

      expect(layoutEH.emitInner).toHaveBeenCalledWith(getEventType(MainLayoutEvent.GetPublicData));
      expect(layoutDS.toastService.error).toHaveBeenCalledTimes(1);
      const [toast] = layoutDS.toastService.error.mock.calls[0];
      expect(toast.title).toBe('Pundit needs your permission');
      expect(toast.text).toBe("Pundit can't connect to your annotations. Allow it to continue.");
      expect(toast.autoClose).toBe(false);
      expect(toast.actions).toEqual([{ text: 'Allow', payload: 'allow-access' }]);
      expect(request).not.toHaveBeenCalled();

      toast.onAction('allow-access');
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('shows the generic error when the extension can reach the application', async () => {
      jest.spyOn(ExtensionAccessModel, 'hasApiAccess').mockResolvedValue(true);

      listen({ error: 'Internal server error' });
      await flush();

      const [toast] = layoutDS.toastService.error.mock.calls[0];
      expect(toast.title).toBe('Sorry there was a problem');
      expect(toast.actions).toBeUndefined();
    });

    it('does not check access for a signed-out user', async () => {
      const check = jest.spyOn(ExtensionAccessModel, 'hasApiAccess');

      listen({ error: 'Unauthorized' });
      await flush();

      expect(check).not.toHaveBeenCalled();
    });
  });

  it('opens no email verification toast, whatever is_verified says', () => {
    listen(userResponse({ is_verified: false }));
    innerEvents$.next({ type: MainLayoutEvent.IdentitySync });

    expect(layoutDS.userService.iam).toHaveBeenCalled();
    expect(layoutDS.toastService.warn).not.toHaveBeenCalled();
  });

  it('closes the login modal when a sync finds a user the client does not have', () => {
    listen({ error: 'Unauthorized' });
    layoutDS.userService.whoami.mockReturnValue(null);
    layoutDS.punditLoginService.sso.mockReturnValue(of(userResponse()));
    const logout = jest.fn();
    layoutEH.appEvent$.subscribe(({ payload }: any) => logout(payload));

    innerEvents$.next({ type: MainLayoutEvent.IdentitySync });
    logout.mock.calls[0][0].callback();

    expect(layoutDS.punditLoginService.stop).toHaveBeenCalled();
    expect(layoutDS.userService.iam).toHaveBeenCalled();
  });
});
