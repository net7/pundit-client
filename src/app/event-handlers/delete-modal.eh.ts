import { EventHandler } from '@n7-frontend/core';
import { DeleteModalDS } from '../data-sources';

export class DeleteModalEH extends EventHandler {
  public dataSource: DeleteModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'delete-modal.click': {
          const { source } = payload;
          if (['close-icon', 'action-cancel'].includes(source)) {
            this.dataSource.close();
            this.emitOuter('close');
          } else if (source === 'action-ok') {
            this.emitOuter('ok');
            this.dataSource.close();
          }
          break;
        }
        case 'delete-modal.close':
          this.dataSource.close();
          this.emitOuter('close');
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'main-layout.annotationdeleteclick':
          this.dataSource.open();
          break;
        default:
          break;
      }
    });
  }
}
