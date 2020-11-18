import { EventHandler } from '@n7-frontend/core';

export class MainLayoutEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'pnd-main-layout.init':
          this.dataSource.onInit(payload);
          break;
        default:
          break;
      }
    });

    /* this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        default:
          break;
      }
    }); */
  }
}
