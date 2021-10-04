import { EventHandler } from '@n7-frontend/core';
import { EditModalDS } from '../data-sources';
import {
  EditModalEvent, getEventType, MainLayoutEvent
} from '../event-types';

export class EditModalEH extends EventHandler {
  public dataSource: EditModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case EditModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(EditModalEvent.Close));
          break;
        case EditModalEvent.Save:
          this.dataSource.close();
          this.emitOuter(getEventType(EditModalEvent.Save), payload);
          break;
        case EditModalEvent.NotebookChange:
          this.emitOuter(getEventType(EditModalEvent.NotebookChange));
          break;
        case EditModalEvent.CreateNotebookError:
          this.emitOuter(getEventType(EditModalEvent.CreateNotebookError), payload);
          break;
        case EditModalEvent.CreateNotebookSuccess:
          this.emitOuter(getEventType(EditModalEvent.CreateNotebookSuccess));
          break;
        case EditModalEvent.NotebookSelectorModeChanged:
          this.dataSource.changeActionsVisibility(payload === 'input');
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.ClickTooltip:
          if (payload === 'highlight') {
            this.closeModal();
          }
          break;
        case MainLayoutEvent.KeyUpEscape:
          this.closeModal();
          break;
        default:
          break;
      }
    });
  }

  private closeModal() {
    if (this.dataSource.isVisible()) {
      this.dataSource.close();
      this.emitOuter('close');
    }
  }
}
