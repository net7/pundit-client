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
          const annotation = this.annotationService.getAnnotationById(id);
          if (!annotation) {
            return;
          }
          switch (source) {
            case 'box': // click on the annotation container (while collapsed)
              annotation.ds.setCollapsedState(false);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: false });
              break;
            case 'compress': // collapse the annotation
              annotation.ds.setCollapsedState(true);
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: true });
              break;
            case 'action-delete': // click on the "delete" button
              annotation.ds.closeMenu();
              this.emitOuter(getEventType(AnnotationEvent.Delete), id);
              break;
            case 'action-comment': // click on the "edit comment" button
              annotation.ds.closeMenu();
              this.emitOuter(getEventType(AnnotationEvent.EditComment), id);
              break;
            case 'action-tags': // click on the "edit tag" button
              annotation.ds.closeMenu();
              this.emitOuter(getEventType(AnnotationEvent.EditTags), id);
              break;
            case 'menu-header': // annotation update menu header
              annotation.ds.toggleActionsMenu();
              break;
            case 'document': // annotation update menu header
              annotation.ds.closeMenu();
              break;
            case 'action-notebooks': // annotation update menu header
              annotation.ds.refreshNotebookList();
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
        case AnnotationEvent.CreateNotebook: {
          const annotationDS = this.getAnnotationDatasource(payload.annotation);
          annotationDS.changeNotebookSelectorLoadingState(true);
          annotationDS.closeMenu();
          this.emitOuter(getEventType(type), payload);
        } break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case SidebarLayoutEvent.AnnotationUpdateNotebook: {
          const { annotationID, notebook } = payload;
          const annotation = this.annotationService.getAnnotationById(annotationID);
          if (!annotation) {
            annotation.ds.changeNotebookSelectorLoadingState(false);
            annotation.ds.transferAnnotationToNotebook(notebook);
            annotation.ds.closeMenu();
          }
          break;
        }
        case SidebarLayoutEvent.AnchorMouseOver: {
          const annotation = this.annotationService.getAnnotationById(payload);
          if (!annotation) { return; }
          annotation.ds.onAnchorMouseOver();
          break;
        }
        case SidebarLayoutEvent.AnchorMouseLeave: {
          const annotation = this.annotationService.getAnnotationById(payload);
          if (!annotation) { return; }
          annotation.ds.onAnchorMouseLeave();
          break;
        }
        case SidebarLayoutEvent.AnchorClick: {
          const annotation = this.annotationService.getAnnotationById(payload);
          annotation.ds.onAnchorClick();
          break;
        }
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
