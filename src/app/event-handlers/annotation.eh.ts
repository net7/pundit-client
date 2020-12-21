import { EventHandler } from '@n7-frontend/core';
import { AnnotationDS } from '../data-sources';

export class AnnotationEH extends EventHandler {
  public dataSource: AnnotationDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.click': {
          const { source, id } = payload;
          if (source === 'box') {
            this.dataSource.toggleCollapse(id);
          } else if (source === 'icon') {
            this.emitOuter('delete', id);
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
