import { first } from 'rxjs/operators';
import { selectionHandler as handler } from '../selection-handler';

describe('Selection', () => {
  describe('changed$ payload', () => {
    let fakeEvent;
    let fakeGetRangeAtCollapsedFalse;
    beforeEach(() => {
      fakeEvent = new Event('selectionchange');
      fakeGetRangeAtCollapsedFalse = jasmine.createSpy().and.returnValue((() => {
        const fakeTextNode = document.createTextNode('Hello world');
        const range = document.createRange();
        range.setStart(fakeTextNode, 0);
        range.setEnd(fakeTextNode, fakeTextNode.length);
        return range;
      })());
    });

    afterEach(() => {
      fakeEvent = null;
      fakeGetRangeAtCollapsedFalse = null;
    });

    it('returns a Range', (done) => {
      spyOn(document, 'getSelection').and.returnValue({
        rangeCount: 1,
        getRangeAt: fakeGetRangeAtCollapsedFalse
      } as Selection);

      handler.changed$.pipe(
        first()
      ).subscribe(() => {
        expect(handler.getCurrentRange() instanceof Range).toBeTruthy();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });
  });
});
