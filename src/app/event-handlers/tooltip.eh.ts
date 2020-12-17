import { EventHandler } from '@n7-frontend/core';
import { TooltipDS } from '../data-sources';

export class TooltipEH extends EventHandler {
  public dataSource: TooltipDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'tooltip.click':
          this.emitOuter(payload);
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'main-layout.selectionchange':
          this.dataSource.setVisible(payload);
          break;
        default:
          break;
      }
    });
  }
}
