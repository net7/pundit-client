import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { create as createAnnotation, remove as deleteAnnotation, search } from 'src/app/models/annotation';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { highlightRange } from 'src/app/models/highlighter';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { from } from 'rxjs';

export class MainLayoutDS extends LayoutDataSource {
  private userService: UserService;

  private notebookService: NotebookService;

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
  }

  getUserAnnotations() {
    console.warn('TODO: test user annotations (search)');
    const uri = getDocumentHref();
    return from(search(uri));
  }

  onSelectionChange() {
    if (this.hasSelection()) {
      tooltipHandler.show(selectionHandler.getCurrentSelection());
    } else {
      tooltipHandler.hide();
    }
  }

  hasSelection = () => !!selectionHandler.getCurrentSelection();

  onHighlight() {
    const range = selectionHandler.getCurrentRange();
    const userId = this.userService.whoami().id;
    const currentNotebookId = this.notebookService.getSelected().id;
    // update host html
    highlightRange(range);
    // clear
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    // annotate
    console.warn('TODO: test salvataggio highlight');
    return from(createAnnotation(userId, currentNotebookId, range));
  }

  onAnnotationDelete(id: string) {
    console.warn('TODO: test annotation delete', id);
    const deleteResponse = deleteAnnotation(id);
    return from(deleteResponse);
  }
}
