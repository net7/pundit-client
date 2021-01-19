import { EventHandler } from '@n7-frontend/core';

export class NotebookPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'notebook-panel.click':
          // todo: handle change of sharing mode
          break;
        default:
          break;
      }
    });
  }
}
