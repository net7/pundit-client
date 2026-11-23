import { isPdfDocument } from './isPdfDocument';

jest.mock('.', () => ({ getPdfViewerPath: () => 'chrome-extension://id/pdf-viewer.html' }));

const response = (contentType: string | null) => ({
  headers: { get: (name: string) => (name === 'Content-Type' ? contentType : null) },
});

describe('isPdfDocument', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('recognises a .pdf URL without a request', async () => {
    await expect(isPdfDocument('https://example.com/doc.pdf')).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never treats the viewer itself as a PDF', async () => {
    await expect(isPdfDocument('chrome-extension://id/pdf-viewer.html?source=x.pdf')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['chrome://extensions/?id=abc', 'about:blank', 'chrome-extension://other/page.html', 'not a url', 'file:///home/doc'])(
    'does not fetch %s',
    async (url) => {
      await expect(isPdfDocument(url)).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('reads the Content-Type of a web URL and aborts the download', async () => {
    fetchMock.mockResolvedValue(response('application/pdf; charset=binary'));

    await expect(isPdfDocument('https://arxiv.org/pdf/1706.03762')).resolves.toBe(true);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal.aborted).toBe(true);
  });

  it('is not a PDF for another Content-Type', async () => {
    fetchMock.mockResolvedValue(response('text/html; charset=utf-8'));

    await expect(isPdfDocument('https://example.com/')).resolves.toBe(false);
  });

  it('is not a PDF, without logging an error, when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(isPdfDocument('https://nonexistent.invalid/')).resolves.toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });
});
