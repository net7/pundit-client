import { first } from 'rxjs/operators';
import { selectionModel as model } from '../selection-model';

describe('Selection', () => {
  describe('changed$ payload', () => {
    let fakeEvent;
    let fakeGetRangeAtCollapsedFalse;
    beforeEach(() => {
      fakeEvent = new Event('selectionchange');
      fakeGetRangeAtCollapsedFalse = jest.fn().mockReturnValue((() => {
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
      jest.spyOn(document, 'getSelection').mockReturnValue({
        rangeCount: 1,
        getRangeAt: fakeGetRangeAtCollapsedFalse
      } as unknown as Selection);

      model.changed$.pipe(
        first()
      ).subscribe(() => {
        expect(model.getCurrentRange() instanceof Range).toBeTruthy();
        done();
      });
      document.dispatchEvent(fakeEvent);
    });
  });
});
