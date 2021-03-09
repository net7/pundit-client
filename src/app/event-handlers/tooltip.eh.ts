import { EventHandler } from '@n7-frontend/core';
import { TooltipDS } from '../data-sources';
import { getEventType, MainLayoutEvent, TooltipEvent } from '../event-types';

export class TooltipEH extends EventHandler {
  public dataSource: TooltipDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case TooltipEvent.Click:
          this.emitOuter(getEventType(TooltipEvent.Click), payload);
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.SelectionChange:
          this.dataSource.setVisible(payload);
          break;
        default:
          break;
      }
    });
  }
}
