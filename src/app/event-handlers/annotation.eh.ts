import { EventHandler } from '@n7-frontend/core';
import { AnnotationEvent, getEventType, SidebarLayoutEvent } from '../event-types';
import { AnnotationService } from '../services/annotation.service';

export class AnnotationEH extends EventHandler {
  public annotationService: AnnotationService;

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
              this.getAnnotationDatasource(id).setCollapsedState(false);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: false });
              break;
            case 'compress': // collapse the annotation
              this.getAnnotationDatasource(id).setCollapsedState(true);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: true });
              break;
            case 'action-delete': // click on the "delete" button
              this.getAnnotationDatasource(id).closeMenu();
              this.emitOuter(getEventType(AnnotationEvent.Delete), id);
              break;
            case 'action-comment': // click on the "edit comment" button
              this.getAnnotationDatasource(id).closeMenu();
              this.emitOuter(getEventType(AnnotationEvent.EditComment), id);
              break;
            case 'menu-header': // annotation update menu header
              this.getAnnotationDatasource(id).toggleActionsMenu();
              break;
            case 'document': // annotation update menu header
              this.getAnnotationDatasource(id).closeMenu();
              break;
            case 'action-notebooks': // annotation update menu header
              this.getAnnotationDatasource(id).refreshNotebookList();
              break;
            default:
              break;
          }
        } break;
        case AnnotationEvent.UpdateNotebook:
        case AnnotationEvent.MouseEnter:
        case AnnotationEvent.MouseLeave:
          this.emitOuter(getEventType(type), payload);
          break;
        case AnnotationEvent.CreateNotebook:
          this.getAnnotationDatasource(payload.annotation).changeNotebookSelectorLoadingState(true);
          this.emitOuter(getEventType(type), payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case SidebarLayoutEvent.AnnotationUpdateNotebook: {
          const { annotationID, notebook } = payload;
          this.getAnnotationDatasource(annotationID).changeNotebookSelectorLoadingState(false);
          this.getAnnotationDatasource(annotationID).transferAnnotationToNotebook(notebook);
          this.getAnnotationDatasource(annotationID).closeMenu();
          break;
        }
        case SidebarLayoutEvent.AnchorMouseOver:
          this.getAnnotationDatasource(payload).onAnchorMouseOver();
          break;
        case SidebarLayoutEvent.AnchorMouseLeave:
          this.getAnnotationDatasource(payload).onAnchorMouseLeave();
          break;
        case SidebarLayoutEvent.AnchorClick:
          this.getAnnotationDatasource(payload).onAnchorClick();
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }

  private getAnnotationDatasource(id: string) {
    const annotation = this.annotationService.getAnnotationById(id);
    return annotation.ds;
  }
}
