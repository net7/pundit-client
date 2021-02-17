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
          } else if (source === 'action-save') {
            this.dataSource.close();
            this.emitOuter('save');
          }
          break;
        }
        case 'comment-modal.textchange': // the comment is edited
          this.dataSource.onTextChange(payload);
          this.emitOuter('change', payload);
          break;
        case 'comment-modal.changenotebook': // a different notebook is selected
          this.emitOuter('notebook', payload);
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
