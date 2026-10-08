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

  it('closes the edit modal after saving an update (add a comment to a tag annotation)', () => {
    // User adds a comment to an existing (tag) annotation and clicks Save.
    clickSave({ comment: { value: 'a new comment' } });

    // The annotation is updated...
    expect(appEvents.some((e) => e.type === AppEvent.CommentUpdate)).toBe(true);

    // ...and the modal-close signal must fire (the same event the create flow
    // emits to make EditModalEH.closeModal() run). This is the regression:
    // the update branch previously never emitted it, so the modal stayed open.
    const emittedCloseSignal = emitOuter.mock.calls
      .some(([type]) => type === getEventType(MainLayoutEvent.AnnotationCreated));
    expect(emittedCloseSignal).toBe(true);
  });

  it('does not throw when save is clicked without an annotation payload', () => {
    layoutDS.state.annotation.updatePayload = null;
    layoutDS.state.annotation.pendingPayload = null;

    expect(() => clickSave({ comment: { value: 'a new comment' } })).not.toThrow();
    expect(layoutEH.handleError).toHaveBeenCalledWith(expect.any(Error));
  });
});
