import { EventHandler } from '@n7-frontend/core';
import { Notebook } from '@pundit/communication';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';
import { AnnotationEvent, getEventType, SidebarLayoutEvent } from '../event-types';
import { AnnotationService } from '../services/annotation.service';
import { NotebookData, NotebookService } from '../services/notebook.service';

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
              annotation.state$.next({...currentState,  isCollapsed: false}) 
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: false });
              break;
            case 'compress': // collapse the annotation
              annotation.state$.next({...currentState,  isCollapsed: true}) 
              this.emitOuter(getEventType(AnnotationEvent.ToggleCollapsed), { collapsed: true });
              break;
            case 'action-delete': // click on the "delete" button
              // annotation.ds.closeMenu();
              annotation.state$.next({...currentState,  activeMenu: undefined}) 
              this.emitOuter(getEventType(AnnotationEvent.Delete), id);
              break;
            case 'action-comment': // click on the "edit comment" button
              // annotation.ds.closeMenu();
              annotation.state$.next({...currentState,  activeMenu: undefined}) 
              this.emitOuter(getEventType(AnnotationEvent.EditComment), id);
              break;
            case 'action-tags': // click on the "edit tag" button
              // annotation.ds.closeMenu();
              annotation.state$.next({...currentState,  activeMenu: undefined}) 
              this.emitOuter(getEventType(AnnotationEvent.EditTags), id);
              break;
            case 'action-semantic': // click on the "edit tag" button
              // annotation.ds.closeMenu();
              annotation.state$.next({...currentState,  activeMenu: undefined}) 
              this.emitOuter(getEventType(AnnotationEvent.EditSemantic), id);
              break;
            case 'menu-header': // annotation update menu header
              const newState = {...currentState,  activeMenu: currentState?.activeMenu ? undefined : 'actions' };
              annotation.state$.next(newState)
              this.listenDocumentClicks( annotation.state$);
              // annotation.ds.toggleActionsMenu();
              break;
            case 'document': // annotation update menu header
            annotation.state$.next({...currentState,  activeMenu: undefined}) 
              // annotation.ds.closeMenu();
              break;
            case 'action-notebooks': // annotation update menu header
              annotation.state$.next({...currentState, activeMenu: 'notebooks'})
              this.listenDocumentClicks(annotation.state$)
              // annotation.ds.refreshNotebookList();
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
          // const annotationDS = this.getAnnotationDatasource(payload.annotation);
          // annotationDS.changeNotebookSelectorLoadingState(true);
          // annotationDS.closeMenu();
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
            // annotation.ds.changeNotebookSelectorLoadingState(false);
            // annotation.ds.transferAnnotationToNotebook(notebook);
            // annotation.ds.closeMenu();
          }
          break;
        }
        case SidebarLayoutEvent.AnchorMouseOver: {
          const annotation = this.annotationService.getAnnotationById(payload);
          if (!annotation) { return; }
          // annotation.ds.onAnchorMouseOver();
          break;
        }
        case SidebarLayoutEvent.AnchorMouseLeave: {
          const annotation = this.annotationService.getAnnotationById(payload);
          if (!annotation) { return; }
          // annotation.ds.onAnchorMouseLeave();
          break;
        }
        case SidebarLayoutEvent.AnchorClick: {
          const annotation = this.annotationService.getAnnotationById(payload);
          // annotation.ds.onAnchorClick();
          break;
        }
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }

  newNotebookSelector(notebook: NotebookData, notebooks: NotebookData[]) {
    const notebookSelectorData: NotebookSelectorData = {
      selectedNotebook: notebook,
      notebookList: notebooks,
      mode: 'select',
      createOption: {
        label: 'New notebook',
        value: 'createnotebook',
      },
      _meta: {
        isExpanded: false,
      }
    };
    return notebookSelectorData;
  }


    /**
   * Listen for clicks on the HTML document,
   * if the document is clicked outside of the inner menu
   * then the menu should be dismissed.
   */
     listenDocumentClicks(state$: BehaviorSubject<any>) {
      fromEvent(document, 'click') // listen for clicks on the document
        .pipe(takeUntil(this.onMenuFocusLost)) // keep listening until the menu is closed
        .subscribe((e: PointerEvent) => {
          const clickedElement: Element = (e as any).path[0]; // get the element that was clicked
          // only act if the clicked item is NOT the notebook-selector component
          if (clickedElement.className && !clickedElement.className
            .match(/(pnd-notebook-selector__)(selected|dropdown-new|create-field|create-btn-save)/gi)) {
            this.onMenuFocusLost.next(true);
            const currentState = state$.getValue();
            state$.next({...currentState, activeMenu: undefined})
          }
        });
    }
  

  // private getAnnotationDatasource(id: string) {
  //   const annotation = this.annotationService.getAnnotationById(id);
  //   return annotation.ds;
  // }
}
