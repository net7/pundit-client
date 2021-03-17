import {
  BrowserRange,
  NormalizedRange,
  SerializedRange,
} from '../index';

import { BrowserNormalizedRange } from '../../types';
import { RangeAnchor } from '../../anchors';

const { sniff } = RangeAnchor;

describe('annotator/anchoring/range', () => {
  let container;
  const html = `
      <section id="section-1">
        <p id="p-1">text 1</p>
        <p id="p-2">text 2a<br/>text 2b</p>
        <span id="span-1">
          <p id="p-3">text 3</p>
          <p id="p-4"></p>
          <p id="p-5"><br/></p>
        </span>
      </section>
      <span id="span-2"></span>`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.prepend(container);
    // Remove extraneous white space which can affect offsets in tests.
    // 1. Two or more spaces in a row
    // 2. New lines
    container.innerHTML = html.replace(/[\s+]{2,}|\n+/g, '');
  });

  afterEach(() => {
    container.remove();
  });

  function createBrowserRange(props = {}) {
    return new BrowserRange({
      commonAncestorContainer: container,
      startContainer: container.querySelector('#p-1').firstChild,
      startOffset: 0,
      endContainer: container.querySelector('#p-3').firstChild,
      endOffset: 1,
      ...props,
    } as Range);
  }

  function createNormalizedRange(props = {}) {
    return new NormalizedRange({
      commonAncestor: container,
      startContainer: container.querySelector('#p-1').firstChild,
      endContainer: container.querySelector('#p-3').firstChild,
      ...props,
    } as BrowserNormalizedRange);
  }

  function createSerializedRange(props = {}) {
    return new SerializedRange({
      startContainer: '/section[1]/p[1]',
      startOffset: 0,
      endContainer: '/section[1]/span[1]/p[1]',
      endOffset: 6,
      ...props,
    });
  }

  describe('sniff', () => {
    it('returns a NormalizedRange when range.commonAncestorContainer exists', () => {
      const result = sniff({
        commonAncestorContainer: container,
        startContainer: container.querySelector('#p-1').firstChild,
        startOffset: 0,
        endContainer: container.querySelector('#p-3').firstChild,
        endOffset: 1,
      }, container);
      expect(result instanceof NormalizedRange).toBeTruthy();
    });

    it('returns a NormalizedRange when range.startContainer is a string', () => {
      const result = sniff({
        startContainer: '/section[1]/p[1]',
        startOffset: 0,
        endContainer: '/section[1]/span[1]/p[1]',
        endOffset: 6,
      }, container);
      expect(result instanceof NormalizedRange).toBeTruthy();
    });

    it('returns a NormalizedRange when range.startContainer is an object', () => {
      const result = sniff({
        commonAncestor: container,
        startContainer: container.querySelector('#p-1').firstChild,
        endContainer: container.querySelector('#p-3').firstChild,
      }, container);
      expect(result instanceof NormalizedRange).toBeTruthy();
    });

    it("throws an error if it can't detect a range type", () => {
      expect(() => {
        sniff({
          fake: true,
        }, container);
      }).toThrow(Error('Could not sniff range type'));
    });
  });

  describe('BrowserRange', () => {
    describe('#constructor', () => {
      it('creates a BrowserRange instance', () => {
        const range = createBrowserRange();
        const {
          commonAncestorContainer,
          startContainer,
          startOffset,
          endContainer,
          endOffset,
          tainted
        } = range;

        expect({
          commonAncestorContainer,
          startContainer,
          startOffset,
          endContainer,
          endOffset,
          tainted
        }).toEqual({
          commonAncestorContainer: container,
          startContainer: container.querySelector('#p-1').firstChild,
          startOffset: 0,
          endContainer: container.querySelector('#p-3').firstChild,
          endOffset: 1,
          tainted: false,
        });
      });
    });

    describe('#normalize', () => {
      it('throws an error if BrowserRange instance is normalized more than once', () => {
        const browserRange = createBrowserRange();
        expect(() => {
          browserRange.normalize();
          browserRange.normalize();
        }).toThrow(Error('You may only call normalize() once on a BrowserRange!'));
      });

      it('return a normalized Range', () => {
        const browserRange = createBrowserRange();
        const normalizedRange = new NormalizedRange(browserRange.normalize());
        expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
      });

      describe('`startContainer` is ELEMENT_NODE', () => {
        it('handles ELEMENT_NODE start node', () => {
          const browserRange = createBrowserRange({
            startContainer: container.querySelector('#p-1'),
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });

        it('handles ELEMENT_NODE start node when `startOffset` > than number of child nodes', () => {
          const browserRange = createBrowserRange({
            startContainer: container.querySelector('#p-1'),
            startOffset: 1,
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });
      });

      describe('endContainer is ELEMENT_NODE', () => {
        it('handles ELEMENT_NODE end node', () => {
          const browserRange = createBrowserRange({
            endContainer: container.querySelector('#p-3'),
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });

        it('handles ELEMENT_NODE end node with no `endOffset` and no children', () => {
          const browserRange = createBrowserRange({
            endContainer: container.querySelector('#p-4'),
            endOffset: 0,
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });

        it('handles ELEMENT_NODE end nodes with no `endOffset` and children', () => {
          const browserRange = createBrowserRange({
            endContainer: container.querySelector('#p-3'),
            endOffset: 0,
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });

        it('handles ELEMENT_NODE end nodes with no `endOffset` and non-TEXT_NODE children', () => {
          const browserRange = createBrowserRange({
            endContainer: container.querySelector('#p-5'),
            endOffset: 0,
          });
          const normalizedRange = new NormalizedRange(browserRange.normalize());
          expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        });
      });

      describe('slices the text elements', () => {
        it('cuts the text node if there is a next sibling', () => {
          const browserRange = createBrowserRange({
            startOffset: 1,
          });
          const normalizedRange = browserRange.normalize();
          expect((normalizedRange.startContainer as any).data).toEqual('ext 1');
        });

        it('cuts the text node if node length > `startOffset`', () => {
          const browserRange = createBrowserRange({
            startContainer: container.querySelector('#p-2').firstChild,
            startOffset: 1,
          });
          const normalizedRange = browserRange.normalize();
          expect((normalizedRange.startContainer as any).data).toEqual('ext 2a');
        });

        it('does not cut the text node when there is no next sibling and node length < `startOffset`', () => {
          const browserRange = createBrowserRange({
            startContainer: container.querySelector('#p-2').firstChild,
            startOffset: 7,
            endOffset: 14,
          });
          const normalizedRange = browserRange.normalize();
          expect((normalizedRange.startContainer as any).data).toEqual('text 2b');
        });
      });

      describe('the whole selection is inside one text node', () => {
        [
          {
            startOffset: 1,
            endOffset: 3,
            result: 'ex',
          },
          {
            startOffset: 0,
            endOffset: 7,
            result: 'text 1',
          },
        ].forEach((test) => {
          it('crops the text node appropriately', () => {
            const browserRange = createBrowserRange({
              startContainer: container.querySelector('#p-1').firstChild,
              endContainer: container.querySelector('#p-1').firstChild,
              startOffset: test.startOffset,
              endOffset: test.endOffset,
            });
            const normalizedRange = browserRange.normalize();
            expect((normalizedRange.startContainer as any).data).toEqual(test.result);
          });
        });
      });

      describe('common ancestor is not ELEMENT_NODE', () => {
        it('corrects the common ancestor to the first non-text ancestor', () => {
          const browserRange = createBrowserRange({
            commonAncestorContainer: container.querySelector('#p-1').firstChild,
          });
          const normalizedRange = browserRange.normalize();
          expect(normalizedRange.commonAncestor).toEqual(container.querySelector('#p-1'));
        });
      });
    });
  });

  describe('NormalizedRange', () => {
    describe('#limit, #text and #textNodes methods', () => {
      it('does not limit range if the limit node resides outside of bounds', () => {
        const limit = createNormalizedRange().limit(
          container.querySelector('#span-2')
        );
        expect(limit).toBeNull();
      });

      [
        {
          bound: '#p-1',
          textNodes: ['text 1'],
        },
        {
          bound: '#p-2',
          textNodes: ['text 2a', 'text 2b'],
        },
        {
          bound: '#section-1',
          textNodes: ['text 1', 'text 2a', 'text 2b', 'text 3'],
        },
      ].forEach((test) => {
        it('limits range to the bounding node', () => {
          const limit = createNormalizedRange().limit(
            container.querySelector(test.bound)
          );
          expect(limit.text()).toEqual(test.textNodes.join(''));
          expect(test.textNodes).toEqual(limit.textNodes().map((n) => n.data));
        });
      });
    });

    describe('#toRange', () => {
      let fakeSetStartBefore;
      let fakeSetEndAfter;

      beforeEach(() => {
        fakeSetStartBefore = jasmine.createSpy().and.stub();
        fakeSetEndAfter = jasmine.createSpy().and.stub();
        spyOn(document, 'createRange').and.returnValue({
          setStartBefore: fakeSetStartBefore,
          setEndAfter: fakeSetEndAfter,
        } as any);
      });

      it('converts normalized range to native range', () => {
        const range = createNormalizedRange();
        const nativeRange = range.toRange();
        expect(nativeRange).toEqual(document.createRange());
        expect(fakeSetStartBefore).toHaveBeenCalledWith(range.startContainer);
        expect(fakeSetEndAfter).toHaveBeenCalledWith(range.endContainer);
      });
    });

    describe('#serialize', () => {
      it('serialize the range with relative parent', () => {
        const serializedRange = createNormalizedRange().serialize(container);
        expect(serializedRange).toEqual({
          startContainer: '/section[1]/p[1]',
          endContainer: '/section[1]/span[1]/p[1]',
          startOffset: 0,
          endOffset: 6,
        });
      });

      it('serialize the range with no relative parent', () => {
        const serializedRange = createNormalizedRange().serialize();
        expect(serializedRange).toEqual({
          startContainer: '/html[1]/body[1]/div[1]/section[1]/p[1]',
          endContainer: '/html[1]/body[1]/div[1]/section[1]/span[1]/p[1]',
          startOffset: 0,
          endOffset: 6,
        });
      });

      it('serialize the range with multiple text nodes', () => {
        const serializedRange = createNormalizedRange({
          startContainer: container.querySelector('#p-2').firstChild.nextSibling
            .nextSibling,
          endContainer: container.querySelector('#p-3').firstChild,
          startOffset: 7,
          endOffset: 6,
        }).serialize();

        expect(serializedRange).toEqual({
          startContainer: '/html[1]/body[1]/div[1]/section[1]/p[2]',
          endContainer: '/html[1]/body[1]/div[1]/section[1]/span[1]/p[1]',
          startOffset: 7,
          endOffset: 6,
        });
      });
    });
  });

  describe('SerializedRange', () => {
    describe('#constructor', () => {
      it('creates a SerializedRange instance', () => {
        const range = createSerializedRange();
        expect(range.toObject()).toEqual({
          startContainer: '/section[1]/p[1]',
          startOffset: 0,
          endContainer: '/section[1]/span[1]/p[1]',
          endOffset: 6,
        });
      });
    });

    describe('#toObject', () => {
      it('returns an object literal', () => {
        const range = createSerializedRange();
        expect(range.toObject()).toEqual({
          startContainer: '/section[1]/p[1]',
          startOffset: 0,
          endContainer: '/section[1]/span[1]/p[1]',
          endOffset: 6,
        });
      });
    });

    describe('#normalize', () => {
      it('returns a normalized range', () => {
        const serializedRange = createSerializedRange();
        const range = serializedRange.normalize(container);
        expect(range.startContainer).toBeTruthy();
      });

      it('adjusts starting offset to second text node', () => {
        const serializedRange = createSerializedRange({
          startContainer: '/section[1]/p[2]',
          endContainer: '/section[1]/p[2]',
          startOffset: 7,
          endOffset: 14,
        });
        const serialized = serializedRange.normalize(container);
        const browserRange = new BrowserRange(serialized).normalize();
        const normalizedRange = new NormalizedRange(browserRange);
        expect(normalizedRange instanceof NormalizedRange).toBeTruthy();
        expect((normalizedRange.startContainer as any).data).toEqual('text 2b');
        expect((normalizedRange.endContainer as any).data).toEqual('text 2b');
      });

      describe('when offsets are invalid', () => {
        it("throws an error if it can't find a valid start offset", () => {
          const serializedRange = createSerializedRange({
            startOffset: 99,
          });
          expect(() => {
            serializedRange.normalize(container);
          }).toThrowError("Couldn't find offset 99 in element /section[1]/p[1]");
        });

        it("throws an error if it can't find a valid end offset", () => {
          const serializedRange = createSerializedRange({
            startOffset: 1,
            endOffset: 99,
          });
          expect(() => {
            serializedRange.normalize(container);
          }).toThrowError("Couldn't find offset 99 in element /section[1]/span[1]/p[1]");
        });
      });

      describe('nodeFromXPath() does not return a valid node', () => {
        it('throws a range error if nodeFromXPath() throws an error', () => {
          const serializedRange = createSerializedRange();
          expect(() => {
            serializedRange.normalize('fakecontainer');
          }).toThrowError();
        });
      });
    });
  });
});
