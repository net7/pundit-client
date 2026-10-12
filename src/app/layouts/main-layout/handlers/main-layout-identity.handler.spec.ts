import { BehaviorSubject, of, Subject } from 'rxjs';
import { MainLayoutEvent } from 'src/app/event-types';
import { MainLayoutIdentityHandler } from './main-layout-identity.handler';

describe('MainLayoutIdentityHandler > active AI key flag', () => {
  let innerEvents$: Subject<{ type: string; payload?: any }>;
  let layoutDS: any;

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
      punditLoginService: { sso: jest.fn(() => of(initResponse)) },
      userService: {
        iam: jest.fn(),
        whoami: jest.fn(() => ({ id: '1' })),
        dashboardNotifications$: new Subject(),
      },
      notebookService: { setSelected: jest.fn() },
      checkUserVerified: jest.fn(),
    };
    const layoutEH: any = { innerEvents$, appEvent$: new Subject(), emitInner: jest.fn() };
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
});
