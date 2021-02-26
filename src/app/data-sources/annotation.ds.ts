import { DataSource } from '@n7-frontend/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationData } from '../components/annotation/annotation';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';

export class AnnotationDS extends DataSource {
  private onMenuFocusLost = new Subject();

  transform(data: AnnotationData[]): AnnotationData[] {
    return data;
  }

  /**
   * Listen for clicks on the HTML document,
   * if the document is clicked outside of the inner menu
   * then the menu should be dismissed.
   */
  listenDocumentClicks(id: string) {
    fromEvent(document, 'click') // listen for clicks on the document
      .pipe(takeUntil(this.onMenuFocusLost)) // keep listening until the menu is closed
      .subscribe((e: PointerEvent) => {
        const clickedElement: Element = (e as any).path[0]; // get the element that was clicked
        // only act if the clicked item is NOT the notebook-selector component
        if (!clickedElement.className
          .match(/(pnd-notebook-selector__)(selected|dropdown-new|create-field)/gi)) {
          this.onMenuFocusLost.next(true);
          this.updateMenuState(id, 'document');
        }
      });
  }

  toggleCollapse(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = !annotation.isCollapsed;
  }

  setCollapsedState(id: string, collapse: boolean) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = collapse;
  }

  updateMenuState(id: string, source) {
    const annotation = this.getAnnotation(id);
    if (source === 'menu-header') {
      annotation.activeMenu = annotation.activeMenu ? undefined : 'actions';
      this.listenDocumentClicks(id);
    }
    if (source === 'action-notebooks') { // click on "Change notebook"
      const { notebookService } = this.options;
      const { notebookId, userId } = annotation._meta;
      const notebook = notebookService.getNotebookById(notebookId);
      const notebooks = notebookService.getByUserId(userId);
      const notebookSelectorData: NotebookSelectorData = {
        selectedNotebook: notebook,
        notebookList: notebooks,
        mode: 'select',
        createOption: {
          label: 'New notebook',
          value: 'createnotebook',
        }
      };
      annotation._meta.notebookSelectorData = notebookSelectorData;
      annotation.activeMenu = 'notebooks';
      this.listenDocumentClicks(id);
    }
    if (source === 'document') {
      annotation.activeMenu = undefined;
    }
  }

  onAnnotationUpdate({ annotationID, notebook }) {
    const annotation = this.getAnnotation(annotationID);
    annotation.notebook = {
      name: notebook.label,
      anchor: {
        payload: { source: 'notebook', id: notebook.id }
      }
    };
    if (annotation._meta?.notebookSelectorData) {
      annotation._meta.notebookSelectorData.selectedNotebook = notebook;
      annotation._meta.notebookId = notebook.id;
      annotation._meta.isExpanded = false;
      annotation.activeMenu = undefined;
    }
  }

  onAnchorMouseOver(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.classes = 'is-hovered';
  }

  onAnchorMouseLeave(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.classes = '';
  }

  onAnchorClick(id: string) {
    this.toggleCollapse(id);
  }

  private getAnnotation(id: string): AnnotationData {
    return this.output.find(({ _meta }) => _meta.id === id);
  }
}
