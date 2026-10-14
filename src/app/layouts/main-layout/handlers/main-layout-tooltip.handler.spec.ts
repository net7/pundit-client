import { translate } from '@net7/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { AppEvent, TooltipEvent } from 'src/app/event-types';
import en_US from 'src/app/config/i18n/en_US';
import { MainLayoutTooltipHandler } from './main-layout-tooltip.handler';

describe('MainLayoutTooltipHandler > AI annotation click', () => {
  let outerEvents$: Subject<{ type: string; payload?: any }>;
  let appEvents: { type: string; payload?: any }[];
  let layoutDS: any;

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'toast#ai_unavailable_title',
      'toast#ai_error_no_active_api_key',
      'toast#ai_error_open_settings',
      'editmodal#ai_label',
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  beforeEach(() => {
    outerEvents$ = new Subject();
    appEvents = [];
    const appEvent$ = new Subject<{ type: string; payload?: any }>();
    appEvent$.subscribe((e) => appEvents.push(e));

    layoutDS = {
      state: { annotation: {}, hasActiveAiKey: null },
      hasLoaded$: new BehaviorSubject(true),
      isUserLogged: () => true,
      toastService: { warn: jest.fn() },
      addPendingAnnotation$: jest.fn(() => of({ subject: { selected: { text: 'some text' } } })),
      openEditModal: jest.fn(),
    };

    new MainLayoutTooltipHandler(layoutDS, { outerEvents$, appEvent$ } as any).listen();
  });

  const clickAi = () => outerEvents$.next({ type: TooltipEvent.Click, payload: 'aiRequest' });

  it('shows the AI settings toast instead of the modal when the user has no active key', () => {
    layoutDS.state.hasActiveAiKey = false;

    clickAi();

    expect(layoutDS.toastService.warn).toHaveBeenCalledWith(expect.objectContaining({
      title: 'toast#ai_unavailable_title',
      text: 'toast#ai_error_no_active_api_key',
      autoClose: false,
      actions: [{ text: 'toast#ai_error_open_settings', payload: expect.any(String) }],
    }));
    expect(en_US).toHaveProperty(['toast#ai_unavailable_title']);
    expect(layoutDS.addPendingAnnotation$).not.toHaveBeenCalled();
    expect(layoutDS.openEditModal).not.toHaveBeenCalled();
    expect(appEvents.some((e) => e.type === AppEvent.HidePageAnnotations)).toBe(false);
  });

  it.each([true, null])('opens the AI modal when the active key flag is %s', (hasActiveAiKey) => {
    layoutDS.state.hasActiveAiKey = hasActiveAiKey;

    clickAi();

    expect(layoutDS.toastService.warn).not.toHaveBeenCalled();
    expect(layoutDS.openEditModal).toHaveBeenCalledWith(expect.objectContaining({
      textQuote: 'some text',
      sections: [expect.objectContaining({ id: 'aiRequest' })],
    }));
  });
});
