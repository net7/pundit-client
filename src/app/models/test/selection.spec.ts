import { first } from 'rxjs/operators';
import { selectionHandler } from '../selection-handler';

fdescribe('Selection', () => {
  describe('document.selectionchange event', () => {
    it('update changed$ stream', (done) => {
      selectionHandler.changed$.pipe(
        first()
      ).subscribe((payload) => {
        expect(payload).toBeNull();
        done();
      });
      // trigger selection change
      document.dispatchEvent(new Event('selectionchange'));
    });
  });

  describe('changed$ payload', () => {
    let fakeEvent;
    let fakeGetRangeAtCollapsedFalse;
    let fakeGetRangeAtCollapsedTrue;
    beforeEach(() => {
      fakeEvent = new Event('selectionchange');
      fakeGetRangeAtCollapsedFalse = jasmine.createSpy().and.returnValue((() => {
        const fakeTextNode = document.createTextNode('Hello world');
        const range = document.createRange();
        range.setStart(fakeTextNode, 0);
        range.setEnd(fakeTextNode, fakeTextNode.length);
        return range;
      })());
      fakeGetRangeAtCollapsedTrue = jasmine.createSpy().and.returnValue((() => {
        const range = new Range();
        return range;
      })());
    });

    afterEach(() => {
      fakeEvent = null;
      fakeGetRangeAtCollapsedFalse = null;
      fakeGetRangeAtCollapsedTrue = null;
    });

    it('returns a Range', (done) => {
      spyOn(document, 'getSelection').and.returnValue({
        rangeCount: 1,
        getRangeAt: fakeGetRangeAtCollapsedFalse
      } as Selection);

      selectionHandler.changed$.pipe(
        first()
      ).subscribe((payload) => {
        expect(payload instanceof Range).toBeTruthy();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });

    it('returns null when no selection', (done) => {
      spyOn(document, 'getSelection').and.returnValue(null);

      selectionHandler.changed$.pipe(
        first()
      ).subscribe((payload) => {
        expect(payload).toBeNull();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });

    it('returns null when selection.rangeCount < 0', (done) => {
      spyOn(document, 'getSelection').and.returnValue({
        rangeCount: 0
      } as Selection);

      selectionHandler.changed$.pipe(
        first()
      ).subscribe((payload) => {
        expect(payload).toBeNull();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });

    it('returns null when selection is collapsed', (done) => {
      spyOn(document, 'getSelection').and.returnValue({
        getRangeAt: fakeGetRangeAtCollapsedTrue
      } as Selection);

      selectionHandler.changed$.pipe(
        first()
      ).subscribe((payload) => {
        expect(payload).toBeNull();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });
  });
});
