import { Subject } from 'rxjs';
import {
  AppEvent, EditModalEvent, MainLayoutEvent, getEventType
} from 'src/app/event-types';
import { MainLayoutEditModalHandler } from './main-layout-edit-modal.handler';

describe('MainLayoutEditModalHandler > save', () => {
  let outerEvents$: Subject<{ type: string; payload?: any }>;
  let appEvents: { type: string; payload?: any }[];
  let emitOuter: jest.Mock;
  let layoutDS: any;
  let layoutEH: any;

  /** Fire the EditModal "Save" event the same way the modal does on click. */
  const clickSave = (payload: any) => {
    outerEvents$.next({ type: EditModalEvent.Save, payload });
  };

  beforeEach(() => {
    outerEvents$ = new Subject();
    appEvents = [];
    emitOuter = jest.fn();

    const appEvent$ = new Subject<{ type: string; payload?: any }>();
    appEvent$.subscribe((e) => appEvents.push(e));

    layoutEH = {
      outerEvents$,
      appEvent$,
      destroy$: new Subject<void>(),
      emitOuter,
      handleError: jest.fn()
    };

    layoutDS = {
      // updatePayload present => isUpdate() is true (editing an existing annotation)
      state: { annotation: { updatePayload: {}, pendingPayload: null } },
      toastService: { working: jest.fn(), error: jest.fn(), success: jest.fn() },
      saveAnnotation: jest.fn(),
      tagService: { addMany: jest.fn() },
      removePendingAnnotation: jest.fn()
    };

    new MainLayoutEditModalHandler(layoutDS, layoutEH).listen();
  });

  const closeSignals = () => emitOuter.mock.calls
    .filter(([type]) => type === getEventType(MainLayoutEvent.AnnotationCreated));

  /** The sidebar performs the update and reports its outcome. */
  const answerUpdate = (saved: boolean) => {
    const update = appEvents.find((e) => e.type === AppEvent.CommentUpdate);
    update?.payload?.done?.(saved);
  };

  it('closes the edit modal once the update is saved (add a comment to a tag annotation)', () => {
    // User adds a comment to an existing (tag) annotation and clicks Save.
    clickSave({ comment: { value: 'a new comment' } });

    // The annotation is sent for update, with the annotation and a completion callback...
    const update = appEvents.find((e) => e.type === AppEvent.CommentUpdate);
    expect(update?.payload).toEqual({ annotation: expect.any(Object), done: expect.any(Function) });
    // ...and the modal stays open until the answer (design D7)
    expect(closeSignals()).toHaveLength(0);

    answerUpdate(true);

    // the modal-close signal fires (the same event the create flow emits
    // to make EditModalEH.closeModal() run)
    expect(closeSignals()).toHaveLength(1);
    expect(layoutDS.state.annotation.updatePayload).toBeNull();
  });

  it('keeps the edit modal open with the user\'s edit when the update is refused (design D7)', () => {
    const updatePayload = layoutDS.state.annotation.updatePayload;

    clickSave({ comment: { value: 'a new comment' } });
    answerUpdate(false);

    expect(closeSignals()).toHaveLength(0);
    // the modal still edits the same annotation: a second Save retries
    expect(layoutDS.state.annotation.updatePayload).toBe(updatePayload);
  });

  it('does not throw when save is clicked without an annotation payload', () => {
    layoutDS.state.annotation.updatePayload = null;
    layoutDS.state.annotation.pendingPayload = null;

    expect(() => clickSave({ comment: { value: 'a new comment' } })).not.toThrow();
    expect(layoutEH.handleError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('MainLayoutEditModalHandler > discard AI preview', () => {
  it('discards the preview a card asks for, until the layout is destroyed', () => {
    const appEvent$ = new Subject<{ type: string; payload?: any }>();
    const destroy$ = new Subject<void>();
    const layoutEH: any = {
      outerEvents$: new Subject(), appEvent$, destroy$, emitOuter: jest.fn(), handleError: jest.fn(),
    };
    const handler = new MainLayoutEditModalHandler({} as any, layoutEH);
    const discard = jest.spyOn((handler as any).aiHandler, 'discardAiPreview').mockImplementation(() => undefined);
    handler.listen();

    appEvent$.next({ type: AppEvent.AiPreviewClear });
    appEvent$.next({ type: AppEvent.AiPreviewDiscard, payload: 'ai-preview-2' });
    expect(discard.mock.calls).toEqual([['ai-preview-2']]);

    destroy$.next();
    appEvent$.next({ type: AppEvent.AiPreviewDiscard, payload: 'ai-preview-0' });
    expect(discard).toHaveBeenCalledTimes(1);
  });
});

describe('MainLayoutEditModalHandler > discard a triple of an AI preview', () => {
  it('discards the triple a card asks for, until the layout is destroyed', () => {
    const appEvent$ = new Subject<{ type: string; payload?: any }>();
    const destroy$ = new Subject<void>();
    const layoutEH: any = {
      outerEvents$: new Subject(), appEvent$, destroy$, emitOuter: jest.fn(), handleError: jest.fn(),
    };
    const handler = new MainLayoutEditModalHandler({} as any, layoutEH);
    const discard = jest.spyOn((handler as any).aiHandler, 'discardAiPreviewTriple').mockImplementation(() => undefined);
    handler.listen();

    appEvent$.next({ type: AppEvent.AiPreviewDiscard, payload: 'ai-preview-1' });
    appEvent$.next({ type: AppEvent.AiPreviewTripleDiscard, payload: { id: 'ai-preview-2', index: 1 } });
    expect(discard.mock.calls).toEqual([['ai-preview-2', 1]]);

    destroy$.next();
    appEvent$.next({ type: AppEvent.AiPreviewTripleDiscard, payload: { id: 'ai-preview-0', index: 0 } });
    expect(discard).toHaveBeenCalledTimes(1);
  });
});
