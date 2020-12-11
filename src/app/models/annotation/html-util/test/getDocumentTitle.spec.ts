import { getDocumentTitle } from '../getDocumentTitle';

describe('html-util > getDocumentTitle', () => {
  it('returns document title', () => {
    const fakeDocument = {
      title: 'Hello World'
    } as Document;
    expect(getDocumentTitle(fakeDocument)).toEqual(fakeDocument.title);
  });
});
