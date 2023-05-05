import { PdfErrorModalDS } from 'src/app/data-sources';
import { PdfErrorModalEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutPdfErrorModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    // listen for pdf service errors
    this.layoutDS.pdfService.error$.subscribe(({ type, payload }) => {
      const { url } = payload;
      if (type === 'MissingPDFException' && url.indexOf('file') === 0) {
        const modalDS: PdfErrorModalDS = this.layoutDS.getWidgetDataSource('pdf-error-modal');
        modalDS.open();
      }
    });

    // listen for modal events
    this.layoutEH.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case PdfErrorModalEvent.Confirm: {
          const extensionId = chrome?.runtime?.id;
          if (!extensionId) {
            console.warn('Extension settings not found:', extensionId);
          } else {
            chrome.extension.isAllowedFileSchemeAccess(
              (isAllowedAccess) => {
                if (!isAllowedAccess) {
                  const settingsUrl = `chrome://extensions/?id=${extensionId}`;
                  chrome.tabs.update({ url: settingsUrl });
                }
              }
            );
          }
        } break;
        case PdfErrorModalEvent.Close:
          break;
        default:
          break;
      }
    });
  }
}
