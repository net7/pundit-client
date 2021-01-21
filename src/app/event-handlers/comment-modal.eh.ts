import { EventHandler } from '@n7-frontend/core';
import { CommentModalDS } from '../data-sources';

export class CommentModalEH extends EventHandler {
  public dataSource: CommentModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'comment-modal.click': {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter('close');
          } else if (source === 'notebooks-header') {
            this.dataSource.notebooksToggle();
          } else if (source === 'notebook-item') {
            this.emitOuter('notebook', payload.notebookId);
          } else if (source === 'action-save') {
            this.emitOuter('save');
            this.dataSource.close();
          }
          break;
        }
        case 'comment-modal.change':
          this.emitOuter('change', payload);
          break;
        case 'comment-modal.close':
          this.dataSource.close();
          this.emitOuter('close');
          break;
        default:
          break;
      }
    });
  }
}