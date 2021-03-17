import { NormalizedRange } from '../../ranges';
import {
  RangeAnchor,
  TextPositionAnchor,
  TextQuoteAnchor,
} from '../index';

// These are primarily basic API tests for the anchoring classes. Tests for
// anchoring a variety of HTML and PDF content exist in `html-test` and
// `pdf-test`.
describe('annotator/anchoring/types', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = [
      'Four score and seven years ago our fathers brought forth on this continent,',
      'a new nation, conceived in Liberty, and dedicated to the proposition that',
      'all men are created equal.',
    ].join(' ');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('RangeAnchor', () => {
    let fakeSerialize;
    let fakeToRange;

    beforeEach(() => {
      fakeSerialize = () => ({
        startContainer: '/div[1]',
        startOffset: 0,
        endContainer: '/div[1]',
        endOffset: 1,
      });
      fakeToRange = () => 'normalized range';
      spyOn(RangeAnchor, 'sniff').and.returnValue({
        serialize: fakeSerialize,
        toRange: fakeToRange,
      } as NormalizedRange);
    });

    afterEach(() => {
      fakeSerialize = null;
      fakeToRange = null;
    });

    describe('#fromRange', () => {
      it('returns a RangeAnchor instance', () => {
        const anchor = RangeAnchor.fromRange(container, new Range());
        expect(RangeAnchor.sniff).toHaveBeenCalled();
        expect(anchor instanceof RangeAnchor).toBeTruthy();
        expect(anchor.range).toBeTruthy();
      });
    });

    describe('#fromSelector', () => {
      it('returns a RangeAnchor instance', () => {
        const anchor = RangeAnchor.fromSelector(container, {
          // type: 'RangeSelector',
          startContainer: '/div[1]',
          startOffset: 0,
          endContainer: '/div[1]',
          endOffset: 1,
        });
        expect(anchor instanceof RangeAnchor).toBeTruthy();

        // FIXME: spy of constructor
        // assert.calledOnce(fakeSerializedRange);
      });
    });

    describe('#toRange', () => {
      it('returns a normalized range result', () => {
        const range = new RangeAnchor(container, new Range());
        expect(range.toRange()).toEqual('normalized range');
      });
    });

    describe('#toSelector', () => {
      it('returns a RangeSelector', () => {
        const range = new RangeAnchor(container, new Range());
        expect(range.toSelector()).toEqual({
          type: 'RangeSelector',
          startContainer: '/div[1]',
          startOffset: 0,
          endContainer: '/div[1]',
          endOffset: 1,
        });
      });

      // BUG: there are no toSelector options
      // it('returns a RangeSelector if options are missing', () => {
      //   const range = new RangeAnchor(container, new Range());
      //   assert.deepEqual(range.toSelector(), rangeSelectorResult());
      // });
    });
  });

  describe('TextPositionAnchor', () => {
    beforeEach(() => {
      spyOn(TextPositionAnchor, 'fromRange').and.callThrough();
      spyOn(TextPositionAnchor.prototype, 'toRange').and.callThrough();
    });

    function createTextPositionAnchor() {
      return new TextPositionAnchor(container, 0, 0);
    }

    describe('#fromRange', () => {
      it('returns a TextPositionAnchor instance', () => {
        const anchor = TextPositionAnchor.fromRange(container, new Range());
        expect(TextPositionAnchor.fromRange).toHaveBeenCalledTimes(1);
        expect(anchor instanceof TextPositionAnchor).toBeTruthy();
      });
    });

    describe('#fromSelector', () => {
      it('returns a TextPositionAnchor instance', () => {
        const anchor = TextPositionAnchor.fromSelector(container, {
          start: 0,
          end: 0,
        });
        expect(anchor instanceof TextPositionAnchor).toBeTruthy();
      });
    });

    describe('#toSelector', () => {
      it('returns a TextPositionSelector', () => {
        const anchor = createTextPositionAnchor();
        expect(anchor.toSelector()).toEqual({
          type: 'TextPositionSelector',
          start: 0,
          end: 0,
        });
      });
    });

    describe('#toRange', () => {
      it('returns a range object', () => {
        const anchor = createTextPositionAnchor();
        expect(anchor.toRange()).toBeTruthy();
        expect(TextPositionAnchor.prototype.toRange).toHaveBeenCalledTimes(1);
      });
    });

    describe('integration tests', () => {
      it('can convert a Range to TextPositionSelector and back to a Range', () => {
        const range = document.createRange();
        range.setStart(container.firstChild, 0);
        range.setEnd(container.firstChild, 4);
        const anchor = TextPositionAnchor.fromRange(container, range);
        expect(anchor.toSelector()).toEqual({
          type: 'TextPositionSelector',
          start: 0,
          end: 4,
        });
        const newRange = anchor.toRange();
        expect(newRange).toEqual(range);
        expect(newRange.toString()).toEqual('Four');
      });
    });
  });

  describe('TextQuoteAnchor', () => {
    beforeEach(() => {
      spyOn(TextQuoteAnchor, 'fromRange').and.callThrough();
    });

    function createTextQuoteAnchor() {
      return new TextQuoteAnchor(container, 'Liberty', {
        prefix: 'a new nation, conceived in ',
        suffix: ', and dedicated to the proposition that',
      });
    }

    describe('#fromRange', () => {
      it('returns a TextQuoteAnchor instance', () => {
        const anchor = TextQuoteAnchor.fromRange(container, new Range());
        expect(TextQuoteAnchor.fromRange).toHaveBeenCalled();
        expect(anchor instanceof TextQuoteAnchor).toBeTruthy();
      });
    });

    describe('#fromSelector', () => {
      it('returns a TextQuoteAnchor instance', () => {
        const anchor = TextQuoteAnchor.fromSelector(container, {
          exact: 'Liberty',
          prefix: 'a new nation, conceived in ',
          suffix: ', and dedicated to the proposition that',
        });
        expect(anchor instanceof TextQuoteAnchor).toBeTruthy();
      });
    });

    describe('#toSelector', () => {
      it('returns a TextQuoteSelector', () => {
        const anchor = createTextQuoteAnchor();
        expect(anchor.toSelector()).toEqual({
          type: 'TextQuoteSelector',
          exact: 'Liberty',
          prefix: 'a new nation, conceived in ',
          suffix: ', and dedicated to the proposition that',
        });
      });
    });

    describe('#toRange', () => {
      it('returns a valid DOM Range', () => {
        const quoteAnchor = new TextQuoteAnchor(container, 'Liberty');
        const range = quoteAnchor.toRange();
        expect(range instanceof Range).toBeTruthy();
        expect(range.toString()).toEqual('Liberty');
      });

      it('throws if the quote is not found', () => {
        const quoteAnchor = new TextQuoteAnchor(
          container,
          'five score and nine years ago'
        );
        expect(() => {
          quoteAnchor.toRange();
        }).toThrowError();
      });
    });

    describe('#toPositionAnchor', () => {
      it('returns a TextPositionAnchor instance', () => {
        const quoteAnchor = new TextQuoteAnchor(container, 'Liberty');
        const pos = quoteAnchor.toPositionAnchor();
        expect(pos instanceof TextPositionAnchor).toBeTruthy();
      });

      it('throws if the quote is not found', () => {
        const quoteAnchor = new TextQuoteAnchor(
          container,
          'some are more equal than others'
        );
        expect(() => {
          quoteAnchor.toPositionAnchor();
        }).toThrowError();
      });
    });

    describe('integration tests', () => {
      it('can convert a Range to TextQuoteSelector and back to a Range', () => {
        const range = document.createRange();
        range.setStart(container.firstChild, 0);
        range.setEnd(container.firstChild, 4);
        const anchor = TextQuoteAnchor.fromRange(container, range);
        expect(anchor.toSelector()).toEqual({
          type: 'TextQuoteSelector',
          prefix: '',
          suffix: ' score and seven years ago our f',
          exact: 'Four',
        });
        const newRange = anchor.toRange();
        expect(newRange.toString()).toEqual('Four');
      });
    });
  });
});
