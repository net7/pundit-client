import { EventHandler } from '@net7/core';
import { PdfErrorModalDS } from '../data-sources';
import { PdfErrorModalEvent, getEventType, MainLayoutEvent } from '../event-types';

export class PdfErrorModalEH extends EventHandler {
  public dataSource: PdfErrorModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case PdfErrorModalEvent.Click: {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter(getEventType(PdfErrorModalEvent.Close));
          } else if (source === 'action-ok') {
            this.emitOuter(getEventType(PdfErrorModalEvent.Confirm));
            this.dataSource.close();
          }
          break;
        }
        case PdfErrorModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(PdfErrorModalEvent.Close));
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case MainLayoutEvent.KeyUpEscape:
          if (this.dataSource.isVisible()) {
            this.dataSource.close();
            this.emitOuter(getEventType(PdfErrorModalEvent.Close));
          }
          break;
        default:
          break;
      }
    });
  }
}
