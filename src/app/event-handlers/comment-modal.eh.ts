import { EventHandler } from '@n7-frontend/core';
import { CommentModalDS } from '../data-sources';
import { CommentModalEvent, getEventType, MainLayoutEvent } from '../events';

export class CommentModalEH extends EventHandler {
  public dataSource: CommentModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case CommentModalEvent.Click: {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter(getEventType(CommentModalEvent.Close));
          } else if (source === 'notebooks-header') {
            this.dataSource.notebooksToggle();
          } else if (source === 'action-save') {
            this.dataSource.close();
            this.emitOuter(getEventType(CommentModalEvent.Save));
          }
        } break;
        case CommentModalEvent.CreateNotebook:
          this.emitOuter(getEventType(CommentModalEvent.CreateNotebook), payload);
          break;
        case CommentModalEvent.TextChange: // the comment is edited
          this.dataSource.onTextChange(payload);
          this.emitOuter(getEventType(CommentModalEvent.TextChange), payload);
          break;
        case CommentModalEvent.NotebookChange: // a different notebook is selected
          this.dataSource.updateSaveButtonState(false);
          this.emitOuter(getEventType(CommentModalEvent.NotebookChange), payload);
          break;
        case CommentModalEvent.Close:
          this.dataSource.close();
          this.emitOuter(getEventType(CommentModalEvent.Close));
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
            this.emitOuter('close');
          }
          break;
        case MainLayoutEvent.UpdateNotebookSelect:
          this.dataSource.updateNotebookSelector(payload);
          break;
        default:
          break;
      }
    });
  }
}
