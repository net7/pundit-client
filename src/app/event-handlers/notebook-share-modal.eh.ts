import { EventHandler } from '@net7/core';
import { NotebookShareModalDS } from '../data-sources';
import { getEventType, MainLayoutEvent, NotebookShareModalEvent } from '../event-types';

export class NotebookShareModalEH extends EventHandler {
  dataSource: NotebookShareModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookShareModalEvent.Click: {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter(getEventType(NotebookShareModalEvent.Close));
          } else if (source === 'action-ok') {
            this.emitOuter(getEventType(NotebookShareModalEvent.Confirm));
            this.dataSource.close();
          }
          break;
        }
        case NotebookShareModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(NotebookShareModalEvent.Close));
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
            this.emitOuter(getEventType(NotebookShareModalEvent.Close));
          }
          break;
        case MainLayoutEvent.AnnotationDeleteClick:
          this.dataSource.open();
          break;
        default:
          break;
      }
    });
  }
}
