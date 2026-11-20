import { isValidAnnotationPayload } from './edit-modal-validation';

const pageSubject = { pageContext: 'http://localhost/', pageTitle: 'The Merchant of Venice' };

const selected = {
  text: 'Portia',
  rangeSelector: { startContainer: '/p[1]', endContainer: '/p[1]', startOffset: 0, endOffset: 6 },
  textQuoteSelector: { exact: 'Portia', prefix: '', suffix: '' },
};

describe('isValidAnnotationPayload', () => {
  it('accepts a page annotation with a comment, with tags or with triples', () => {
    expect(isValidAnnotationPayload({
      type: 'Commenting', subject: pageSubject, content: { comment: 'A comedy.' },
    })).toBe(true);
    expect(isValidAnnotationPayload({
      type: 'Highlighting', subject: pageSubject, tags: ['venice'],
    })).toBe(true);
    expect(isValidAnnotationPayload({
      type: 'Linking', subject: pageSubject, content: [{ predicate: { uri: 'p' }, objectType: 'literal', object: { text: 'x' } }],
    })).toBe(true);
  });

  it('rejects a page annotation without the content of its type', () => {
    expect(isValidAnnotationPayload({ type: 'Commenting', subject: pageSubject, content: { comment: '' } })).toBe(false);
    expect(isValidAnnotationPayload({ type: 'Highlighting', subject: pageSubject })).toBe(false);
    expect(isValidAnnotationPayload({ type: 'Highlighting', subject: pageSubject, tags: [] })).toBe(false);
    expect(isValidAnnotationPayload({ type: 'Linking', subject: pageSubject, content: [] })).toBe(false);
    expect(isValidAnnotationPayload({ type: 'Commenting' })).toBe(false);
    expect(isValidAnnotationPayload(null)).toBe(false);
  });

  it('checks an annotation with a selection as before', () => {
    expect(isValidAnnotationPayload({ type: 'Highlighting', subject: { ...pageSubject, selected } })).toBe(true);
    expect(isValidAnnotationPayload({
      type: 'Commenting',
      content: { comment: 'ok' },
      subject: { ...pageSubject, selected: { ...selected, rangeSelector: { startContainer: '/p[1]' } } },
    })).toBe(false);
    expect(isValidAnnotationPayload({
      type: 'Highlighting',
      tags: ['x'],
      subject: { ...pageSubject, selected: { ...selected, textQuoteSelector: { exact: '' } } },
    })).toBe(false);
  });
});
