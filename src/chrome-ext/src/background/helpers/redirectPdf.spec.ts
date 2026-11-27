import { redirectToOriginalPdfUrl } from './redirectToOriginalPdfUrl';
import { redirectToPdfViewer } from './redirectToPdfViewer';

jest.mock('.', () => ({ getPdfViewerPath: () => 'chrome-extension://pundit/pdf-viewer.html' }));

describe('PDF redirects navigate the given tab, not the focused one (design D7)', () => {
  const update = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).chrome = { tabs: { update } };
  });

  it('opens a PDF in the viewer in the given tab', () => {
    redirectToPdfViewer(7, 'https://x/a b.pdf');

    expect(update).toHaveBeenCalledWith(7, {
      url: 'chrome-extension://pundit/pdf-viewer.html?source=https%3A%2F%2Fx%2Fa%20b.pdf',
    });
  });

  it('brings the given tab back from the viewer to the PDF', () => {
    redirectToOriginalPdfUrl(7, 'chrome-extension://pundit/pdf-viewer.html?source=https%3A%2F%2Fx%2Fa%20b.pdf');

    expect(update).toHaveBeenCalledWith(7, { url: 'https://x/a b.pdf' });
  });
});
