import { EventHandler } from '@n7-frontend/core';

export class NotebookPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'notebook-panel.click':
          this.emitOuter('editsharingmode', payload);
          break;
        case 'notebook-panel.option':
          this.emitOuter('changeselected', payload);
          break;
        case 'notebook-panel.createnotebook':
          this.emitOuter('createnotebook', payload);
          break;
        default:
          break;
      }
    });
  }
}
