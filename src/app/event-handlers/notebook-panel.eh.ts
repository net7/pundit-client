import { EventHandler } from '@net7/core';
import { NotebookPanelDS } from '../data-sources';
import { getEventType, NotebookPanelEvent, SidebarLayoutEvent } from '../event-types';

export class NotebookPanelEH extends EventHandler {
  public dataSource: NotebookPanelDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookPanelEvent.EditSharingMode:
          this.dataSource.changeLoadingState(true);
          this.emitOuter(getEventType(type), payload);
          break;
        case NotebookPanelEvent.ChangeSelected:
          this.emitOuter(getEventType(type), payload);
          break;
        case NotebookPanelEvent.CreateNotebook:
          this.dataSource.changeNotebookSelectorLoadingState(true);
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
        case SidebarLayoutEvent.NotebookPanelNewNotebookCreated:
          this.dataSource.changeNotebookSelectorLoadingState(false);
          break;
        default:
          break;
      }
    });
  }
}
