import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { create as createAnnotation, remove as deleteAnnotation, search } from 'src/app/models/annotation';
import { search as searchNotebooks } from 'src/app/models/notebook';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { highlightRange } from 'src/app/models/highlighter';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { from } from 'rxjs';
import { AnnotationType } from '@pundit/communication';

export class MainLayoutDS extends LayoutDataSource {
  private userService: UserService;

  private notebookService: NotebookService;

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
  }

  getUserAnnotations() {
    const uri = getDocumentHref();
    return from(search(uri));
  }

  getUserNotebooks() {
    return from(searchNotebooks());
  }

  onSelectionChange() {
    if (this.hasSelection()) {
      tooltipHandler.show(selectionHandler.getCurrentSelection());
    } else {
      tooltipHandler.hide();
    }
  }

  hasSelection = () => !!selectionHandler.getCurrentSelection();

  onHighlightOrComment(comment?: string) {
    const range = selectionHandler.getCurrentRange();
    const userId = this.userService.whoami().id;
    const notebookId = this.notebookService.getSelected().id;
    const type: AnnotationType = comment ? 'Commenting' : 'Highlighting';
    const options = comment ? {
      content: {
        comment
      }
    } : {};
    // update host html
    highlightRange(range);
    // clear
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    // annotate
    console.warn('TODO: test salvataggio highlight');
    return from(createAnnotation({
      userId, notebookId, selection: range, type, options
    }));
  }

  onAnnotationDelete(id: string) {
    console.warn('TODO: test annotation delete', id);
    const deleteResponse = deleteAnnotation(id);
    return from(deleteResponse);
  }
}
