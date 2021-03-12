import { EventHandler } from '@n7-frontend/core';
import { getEventType, NotebookPanelEvent, SidebarLayoutEvent } from '../event-types';

export class NotebookPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookPanelEvent.EditSharingMode:
          this.dataSource.changeLoadingState(true);
          this.emitOuter(getEventType(type), payload);
          break;
        case NotebookPanelEvent.ChangeSelected:
        case NotebookPanelEvent.CreateNotebook:
          this.emitOuter(getEventType(type), payload);
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case SidebarLayoutEvent.NotebookSharingModeUpdated:
          this.dataSource.changeLoadingState(false);
          break;
        default:
          break;
      }
    });
  }
}
