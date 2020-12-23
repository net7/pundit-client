import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import {
  create as createAnnotation, createRequestPayload, remove as deleteAnnotation, search
} from 'src/app/models/annotation';
import { search as searchNotebooks } from 'src/app/models/notebook';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { from, of } from 'rxjs';
import { AnnotationType } from '@pundit/communication';
import { switchMap } from 'rxjs/operators';

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
    // clear
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    // annotate
    const requestPayload = createRequestPayload({
      userId, notebookId, selection: range, type, options
    });
    // request
    return from(createAnnotation(requestPayload)).pipe(
      switchMap(({ data }) => of({ id: data.id, requestPayload }))
    );
  }

  onAnnotationDelete(id: string) {
    const deleteResponse = deleteAnnotation(id);
    return from(deleteResponse);
  }
}
