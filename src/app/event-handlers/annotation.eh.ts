import { EventHandler } from '@n7-frontend/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationEvent, getEventType, SidebarLayoutEvent } from '../event-types';
import { AnnotationService } from '../services/annotation.service';
import { NotebookService } from '../services/notebook.service';

export class AnnotationEH extends EventHandler {
  public annotationService: AnnotationService;

  public notebookService: NotebookService;

  private onMenuFocusLost = new Subject();

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
          const currentState = annotation.state$.getValue();
          switch (source) {
            case 'box': // click on the annotation container (while collapsed)
              if (currentState?.isCollapsed) {
                this.annotationService.updateAnnotationState(id, { isCollapsed: false });
                this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: false });
              }
              break;
            case 'compress': // collapse the annotation
              this.annotationService.updateAnnotationState(id, { isCollapsed: true });
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: true });
              break;
            case 'action-delete': // click on the "delete" button
              this.closeAnnotationMenu(id);
              this.emitOuter(getEventType(AnnotationEvent.Delete), id);
              break;
            case 'action-comment': // click on the "edit comment" button
              this.closeAnnotationMenu(id);
              this.emitOuter(getEventType(AnnotationEvent.EditComment), id);
              break;
            case 'action-tags': // click on the "edit tag" button
              this.closeAnnotationMenu(id);
              this.emitOuter(getEventType(AnnotationEvent.EditTags), id);
              break;
            case 'action-semantic': // click on the "edit tag" button
              this.closeAnnotationMenu(id);
              this.emitOuter(getEventType(AnnotationEvent.EditSemantic), id);
              break;
            case 'menu-header': { // annotation update menu header
              const newState = { activeMenu: currentState?.activeMenu ? undefined : 'actions' };
              this.annotationService.updateAnnotationState(id, newState);
              this.listenDocumentClicks(annotation.id);
              break;
            }
            case 'document': // annotation update menu header
              this.closeAnnotationMenu(id);
              break;
            case 'action-notebooks': // annotation update menu header
              if (currentState?.activeMenu !== 'notebooks') {
                this.annotationService.updateAnnotationState(id, { activeMenu: 'notebooks' });
                this.listenDocumentClicks(annotation.id);
              }
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
          const annotation = this.annotationService.getAnnotationById(payload.annotation);
          if (!annotation) { return; }
          const { id } = annotation;
          const newState = { isNotebookSelectorLoading: true };
          this.annotationService.updateAnnotationState(id, newState);
          this.emitOuter(getEventType(type), payload);
          break;
        }
        case AnnotationEvent.ReplyChanged:
          this.emitOuter(getEventType(type));
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case SidebarLayoutEvent.AnnotationUpdateNotebook: {
          const { annotationID } = payload;
          const annotation = this.annotationService.getAnnotationById(annotationID);
          if (!annotation) { return; }
          const newState = { activeMenu: undefined, isNotebookSelectorLoading: false };
          this.annotationService.updateAnnotationState(annotationID, newState);
          break;
        }
        case SidebarLayoutEvent.AnchorMouseOver: {
          const annotationID = payload;
          const annotation = this.annotationService.getAnnotationById(annotationID);
          if (!annotation) { return; }
          this.annotationService.updateAnnotationState(annotationID, { classes: 'is-hovered' });
          break;
        }
        case SidebarLayoutEvent.AnchorMouseLeave: {
          const annotationID = payload;
          const annotation = this.annotationService.getAnnotationById(annotationID);
          if (!annotation) { return; }
          this.annotationService.updateAnnotationState(annotationID, { classes: '' });
          break;
        }
        case SidebarLayoutEvent.AnchorClick: {
          const annotationID = payload;
          const annotation = this.annotationService.getAnnotationById(annotationID);
          if (!annotation) { return; }
          this.updateAnnotationState(annotation);
          break;
        }
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }

  /**
 * Listen for clicks on the HTML document,
 * if the document is clicked outside of the inner menu
 * then the menu should be dismissed.
 */
  listenDocumentClicks(annotationID: string) {
    fromEvent(document, 'click') // listen for clicks on the document
      .pipe(takeUntil(this.onMenuFocusLost)) // keep listening until the menu is closed
      .subscribe((e: PointerEvent) => {
        const clickedElement: Element = (e as any).path[0]; // get the element that was clicked
        // only act if the clicked item is NOT the notebook-selector component
        if (
          typeof clickedElement.className === 'string'
          && !clickedElement.className
            .match(/(pnd-notebook-selector__)(selected|dropdown-new|create-field|create-btn-save)/gi)
        ) {
          this.closeAnnotationMenu(annotationID);
          this.onMenuFocusLost.next(true);
        }
      });
  }

  private closeAnnotationMenu(id: string) {
    this.annotationService.updateAnnotationState(id, { activeMenu: undefined });
  }

  private updateAnnotationState = (annotation) => {
    const { state$ } = annotation;
    const currentState = state$.getValue();
    const newState = { isCollapsed: !currentState.isCollapsed };
    this.annotationService.updateAnnotationState(annotation.id, newState);
  }
}
