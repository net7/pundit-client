import { create } from '../create';

describe('annotation > create', () => {
  let annotation;
  let fakeElement;

  beforeEach(() => {
    const fakeTextNode = document.createTextNode('Hello world');
    const range = document.createRange();
    fakeElement = document.createElement('div');
    fakeElement.appendChild(fakeTextNode);
    document.body.appendChild(fakeElement);
    range.setStart(fakeTextNode, 0);
    range.setEnd(fakeTextNode, fakeTextNode.length);
    annotation = create(range);
  });

  afterEach(() => {
    annotation = null;
    fakeElement.remove();
  });

  it('returns a valid metadata', () => {
    expect(annotation.metadata.href).toEqual(jasmine.any(String));
    expect(annotation.metadata.title).toEqual(jasmine.any(String));
  });

  it('returns a valid selector(s)', () => {
    const types = ['TextPositionSelector', 'TextQuoteSelector', 'RangeSelector'];
    expect(annotation.selector).toEqual(jasmine.any(Array));
    annotation.selector.forEach((strategy) => {
      expect(types.includes(strategy.type)).toBeTruthy();
    });
  });
});
