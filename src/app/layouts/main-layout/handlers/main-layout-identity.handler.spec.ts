import { BehaviorSubject, of, Subject } from 'rxjs';
import { getEventType, MainLayoutEvent } from 'src/app/event-types';
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
