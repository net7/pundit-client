import { EventHandler } from '@n7-frontend/core';

export class TooltipEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'tooltip.highlight':
          break;
        case 'tooltip.comment':
          break;
        default:
          break;
      }
    });
  }
}
