import { EventHandler } from '@n7-frontend/core';
import { AnnotationDS } from '../data-sources';
import { AnnotationEvent, getEventType, SidebarLayoutEvent } from '../event-types';

export class AnnotationEH extends EventHandler {
  public dataSource: AnnotationDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        /**
         * Handle all click events on an annotation with different "source" values
         */
        case AnnotationEvent.Click: {
          const { source, id } = payload;
          switch (source) {
            case 'box': // click on the annotation container (while collapsed)
              this.dataSource.setCollapsedState(id, false);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: false });
              break;
            case 'compress': // collapse the annotation
              this.dataSource.setCollapsedState(id, true);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: true });
              break;
            case 'action-delete': // click on the "delete" button
              this.emitOuter(getEventType(AnnotationEvent.Delete), id);
              break;
            case 'action-comment': // click on the "edit comment" button
              this.emitOuter(getEventType(AnnotationEvent.EditComment), id);
              break;
            default:
              // annotation update menu state
              this.dataSource.updateMenuState(id, source);
              break;
          }
        } break;
        case AnnotationEvent.UpdateNotebook:
        case AnnotationEvent.MouseEnter:
        case AnnotationEvent.MouseLeave:
        case AnnotationEvent.CreateNotebook:
          this.emitOuter(getEventType(type), payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case SidebarLayoutEvent.AnnotationUpdateNotebook:
          this.dataSource.onAnnotationUpdate(payload);
          break;
        case SidebarLayoutEvent.AnchorMouseOver:
          this.dataSource.onAnchorMouseOver(payload);
          break;
        case SidebarLayoutEvent.AnchorMouseLeave:
          this.dataSource.onAnchorMouseLeave(payload);
          break;
        case SidebarLayoutEvent.AnchorClick:
          this.dataSource.onAnchorClick(payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }
}
