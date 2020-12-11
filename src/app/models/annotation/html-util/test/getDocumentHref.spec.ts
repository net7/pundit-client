import { getDocumentHref } from '../getDocumentHref';

describe('html-util > getDocumentHref', () => {
  it('returns href for allowed protocols', () => {
    const fakeDocument = {
      location: {
        href: 'https://example.com'
      }
    } as Document;
    expect(getDocumentHref(fakeDocument)).toEqual(fakeDocument.location.href);
  });

  it('returns baseURI for allowed protocols', () => {
    const fakeDocument = {
      location: {
        href: 'ftp://admin@example.com'
      },
      baseURI: 'https://example.com'
    } as Document;
    expect(getDocumentHref(fakeDocument)).toEqual(fakeDocument.baseURI);
  });

  it('returns href for not allowed protocols', () => {
    const fakeDocument = {
      location: {
        href: 'ftp://admin@example.com'
      },
      baseURI: 'ftp://admin@example.com'
    } as Document;
    expect(getDocumentHref(fakeDocument)).toEqual(fakeDocument.location.href);
  });
});
