import { EventHandler } from '@net7/core';
import { NotebookShareModalDS } from '../data-sources';
import { getEventType, MainLayoutEvent, NotebookShareModalEvent } from '../event-types';

export class NotebookShareModalEH extends EventHandler {
  dataSource: NotebookShareModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookShareModalEvent.Click:
          this.onClick(payload);
          break;
        case NotebookShareModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(NotebookShareModalEvent.Close));
          break;
        case NotebookShareModalEvent.Input:
          this.emitOuter(getEventType(NotebookShareModalEvent.Input), payload);
          break;
        case NotebookShareModalEvent.AutocompleteClick:
          this.dataSource.onAutocompleteClick(payload);
          break;
        case NotebookShareModalEvent.ActionClick:
          this.emitOuter(getEventType(NotebookShareModalEvent.ActionClick), payload);
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.KeyUpEscape:
          if (this.dataSource.isVisible()) {
            this.dataSource.close();
            this.emitOuter(getEventType(NotebookShareModalEvent.Close));
          }
          break;
        case MainLayoutEvent.NotebookShareAutocompleteResponse:
          this.dataSource.updateAutocompleteResults(payload);
          break;
        default:
          break;
      }
    });
  }

  private onClick(payload) {
    const { source } = payload;
    const { accessList } = this.dataSource.output;
    const { invitationsList } = this.dataSource.output;
    switch (source) {
      case 'close-icon':
      case 'action-cancel':
        this.dataSource.close();
        break;
      case 'action-ok':
        if (accessList.readAccess.length) {
          this.emitOuter(getEventType(NotebookShareModalEvent.Ok), accessList);
        }
        this.dataSource.close();
        break;
      case 'action-confirm-ok': {
        const { selected } = this.dataSource.output.body.confirmSection;
        invitationsList.push(selected);
        accessList.readAccess.push(selected.email);
        if (selected.action === 'write') {
          accessList.writeAccess.push(selected.email);
        }
        this.dataSource.closeConfirm();
        break;
      }
      case 'action-confirm-cancel':
        this.dataSource.closeConfirm();
        break;
      default:
        break;
    }
  }
}
