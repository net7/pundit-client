import { EventHandler } from '@n7-frontend/core';
import { EditModalDS } from '../data-sources';
import { EditModalEvent, getEventType, MainLayoutEvent } from '../event-types';

export class EditModalEH extends EventHandler {
  public dataSource: EditModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case EditModalEvent.Click: {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter(getEventType(EditModalEvent.Close));
          } else if (source === 'action-save') {
            this.dataSource.close();
            this.emitOuter(getEventType(EditModalEvent.Save));
          }
        } break;
        case EditModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(EditModalEvent.Close));
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
            this.emitOuter('close');
          }
          break;
        default:
          break;
      }
    });
  }
}
