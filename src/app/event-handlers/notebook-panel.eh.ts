import { EventHandler } from '@n7-frontend/core';
import { getEventType, NotebookPanelEvent } from '../events';

export class NotebookPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookPanelEvent.EditSharingMode:
        case NotebookPanelEvent.ChangeSelected:
        case NotebookPanelEvent.CreateNotebook:
          this.emitOuter(getEventType(type), payload);
          break;
        default:
          break;
      }
    });
  }
}
