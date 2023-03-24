import { EventHandler } from '@net7/core';
import { OnthologiesPanelDS } from '../data-sources';

export class OnthologiesPanelEH extends EventHandler {
  dataSource: OnthologiesPanelDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case `${this.hostId}.click`:
          this.dataSource.onItemClick(payload);
          this.emitOuter('change', this.dataSource.getSelected());
          break;
        default:
          break;
      }
    });
  }
}
