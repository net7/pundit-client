import { _t, translate } from '@net7/core';
import { of, Subject, throwError } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { AppEvent } from 'src/app/event-types';
import { AnnotationCssClass } from 'src/app/services/annotation.service';
import { SidebarLayoutAppEventsHandler } from './sidebar-layout-app-events.handler';

describe('SidebarLayoutAppEventsHandler > annotation update (design D7)', () => {
  let appEvent$: Subject<{ type: string; payload?: any }>;
  let layoutEH: any;
  let layoutDS: any;
  let workingToast: { close: jest.Mock };

  const annotation = {
    id: '01J9ZK7Q3W8X2Y4V6T5R1N0M9P',
    type: 'Commenting',
    content: { comment: 'a new comment' },
    notebookId: 'nb1',
    serializedBy: 'pundit-client',
    subject: {},
    userId: 'u1',
    tags: ['t1'],
  };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    appEvent$ = new Subject();
    workingToast = { close: jest.fn() };
    layoutEH = {
      appEvent$,
      destroy$: new Subject<void>(),
      detectChanges: jest.fn(),
      annotationService: { update: jest.fn(), updateAnnotationState: jest.fn() },
      tagService: { addMany: jest.fn() },
      toastService: {
        working: jest.fn(() => workingToast),
        // a toast runs its onLoad when shown
        error: jest.fn(({ onLoad }) => onLoad?.()),
        success: jest.fn(({ onLoad }) => onLoad?.()),
      },
    };
    layoutDS = { updateAnnotations: jest.fn() };
    new SidebarLayoutAppEventsHandler(layoutDS, layoutEH).listen();
  });

  afterEach(() => jest.restoreAllMocks());

  it('reports a saved update to the edit modal', () => {
    layoutEH.annotationService.update.mockReturnValue(of({ status: 200 }));
    const done = jest.fn();

    appEvent$.next({ type: AppEvent.CommentUpdate, payload: { annotation, done } });

    expect(layoutEH.annotationService.update).toHaveBeenCalledWith(annotation.id, expect.objectContaining({ tags: ['t1'] }));
    expect(done).toHaveBeenCalledWith(true);
    expect(layoutEH.toastService.success).toHaveBeenCalled();
    expect(layoutEH.annotationService.updateAnnotationState)
      .toHaveBeenLastCalledWith(annotation.id, { classes: AnnotationCssClass.Empty });
  });

  it('reports a refused update, shows the error and clears the editing state', () => {
    layoutEH.annotationService.update.mockReturnValue(throwError(() => ({ response: { status: 403 } })));
    const done = jest.fn();

    appEvent$.next({ type: AppEvent.CommentUpdate, payload: { annotation, done } });

    expect(done).toHaveBeenCalledWith(false);
    expect(layoutEH.toastService.error).toHaveBeenCalledWith(expect.objectContaining({
      title: _t('toast#annotationedit_error_title'),
      text: _t('toast#annotationedit_error_text'),
    }));
    expect(workingToast.close).toHaveBeenCalled();
    expect(layoutEH.annotationService.updateAnnotationState)
      .toHaveBeenLastCalledWith(annotation.id, { classes: AnnotationCssClass.Empty });
    expect(layoutEH.toastService.success).not.toHaveBeenCalled();
  });
});
