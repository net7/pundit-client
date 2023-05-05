import { EventHandler } from '@net7/core';
import { DeleteModalDS } from '../data-sources';
import { DeleteModalEvent, getEventType, MainLayoutEvent } from '../event-types';

export class DeleteModalEH extends EventHandler {
  public dataSource: DeleteModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case DeleteModalEvent.Click: {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter(getEventType(DeleteModalEvent.Close));
          } else if (source === 'action-ok') {
            this.emitOuter(getEventType(DeleteModalEvent.Confirm));
            this.dataSource.close();
          }
          break;
        }
        case DeleteModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(DeleteModalEvent.Close));
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
            this.emitOuter(getEventType(DeleteModalEvent.Close));
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
