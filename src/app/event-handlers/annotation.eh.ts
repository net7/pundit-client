import { EventHandler } from '@n7-frontend/core';
import { AnnotationDS } from '../data-sources';

export class AnnotationEH extends EventHandler {
  public dataSource: AnnotationDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        /**
         * Handle all click events on an annotation with different "source" values
         */
        case 'annotation.click': {
          const { source, id } = payload;
          // collapse
          switch (source) {
            case 'box': // click on the annotation container
              this.dataSource.setCollapsedState(id, false);
              this.emitOuter('togglecollapse');
              break;
            case 'compress':
              this.dataSource.setCollapsedState(id, true);
              this.emitOuter('togglecollapsed');
              break;
            case 'action-delete': // click on the "delete" button
              this.emitOuter('delete', id);
              break;
            default:
              // annotation update menu state
              this.dataSource.updateMenuState(id, source);
              break;
          }
        } break;
        case 'annotation.option':
          // change the assigned notebook
          this.emitOuter('updatenotebook', payload);
          break;
        case 'annotation.mouseenter':
          this.emitOuter('mouseenter', payload);
          break;
        case 'annotation.mouseleave':
          this.emitOuter('mouseleave', payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.annotationupdatenb':
          this.dataSource.onAnnotationUpdate(payload);
          break;
        case 'sidebar-layout.anchormouseover':
          this.dataSource.onAnchorMouseOver(payload);
          break;
        case 'sidebar-layout.anchormouseleave':
          this.dataSource.onAnchorMouseLeave(payload);
          break;
        case 'sidebar-layout.anchorclick':
          this.dataSource.onAnchorClick(payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }
}
