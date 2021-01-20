import { EventHandler } from '@n7-frontend/core';

export class NotebookPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'notebook-panel.click':
          this.emitOuter('editsharingmode', payload);
          break;
        case 'notebook-panel.change':
          this.emitOuter('changeselected', payload);
          break;
        default:
          break;
      }
    });
  }
}
