import { EventHandler } from '@n7-frontend/core';

export class CommentModalEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'comment-modal.click': {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
          } else if (source === 'notebooks-header') {
            this.dataSource.notebooksToggle();
          } else if (source === 'notebook-item') {
            this.emitOuter('notebook', payload.notebookId);
          } else if (source === 'action-save') {
            this.emitOuter('save');
          }
          break;
        }
        case 'comment-modal.change':
          this.emitOuter('change', payload);
          break;
        case 'comment-modal.close':
          this.dataSource.close();
          break;
        default:
          break;
      }
    });
  }
}
