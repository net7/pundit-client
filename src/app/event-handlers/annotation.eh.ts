import { EventHandler } from '@n7-frontend/core';
import { AnnotationDS } from '../data-sources';

export class AnnotationEH extends EventHandler {
  public dataSource: AnnotationDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.click': {
          const { source, id } = payload;

          // collapse
          if (source === 'box') {
            this.dataSource.toggleCollapse(id);
            this.emitOuter('togglecollapse');

          // annotation delete
          } else if (source === 'action-delete') {
            this.emitOuter('delete', id);

          // annotation update notebook
          } else if (source === 'notebook-item') {
            this.emitOuter('updatenotebook', id);
            this.dataSource.closeMenu(id);

          // annotation update menu state
          } else {
            this.dataSource.updateMenuState(id, source);
          }
          break;
        }
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }
}
