import { LayoutDataSource } from '@n7-frontend/core';
import {
  from, of, BehaviorSubject
} from 'rxjs';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import {
  create as createAnnotation, createRequestPayload, remove as deleteAnnotation, search
} from 'src/app/models/annotation';
import { search as searchNotebooks } from 'src/app/models/notebook';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';

import { AnnotationType } from '@pundit/communication';
import { switchMap } from 'rxjs/operators';

export class MainLayoutDS extends LayoutDataSource {
  private userService: UserService;

  private notebookService: NotebookService;

  /** Let other layouts know that all services are ready */
  public hasLoaded = new BehaviorSubject(false);

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

  onComment({ selected }) {
    // clear
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    const currentNotebook = this.notebookService.getSelected();
    const notebooks = this.notebookService.getByUserId(this.userService.whoami().id);
    this.one('comment-modal').update({ selected, currentNotebook, notebooks });
  }

  onAnnotationDelete(id: string) {
    const deleteResponse = deleteAnnotation(id);
    return from(deleteResponse);
  }

  getAnnotationRequestPayload() {
    const range = selectionHandler.getCurrentRange();
    const userId = this.userService.whoami().id;
    const selectedNotebookId = this.notebookService.getSelected().id;
    const type: AnnotationType = 'Highlighting';
    const options = {};
    return createRequestPayload({
      userId,
      type,
      options,
      notebookId: selectedNotebookId,
      selection: range,
    });
  }

  getCommentRequestPayload(payload, { comment, notebookId }) {
    // comment check
    if (typeof comment === 'string' && comment.trim()) {
      payload.type = 'Commenting';
      payload.content = {
        comment: comment.trim()
      };
      if (notebookId) {
        payload.notebookId = notebookId;
      }
      return payload;
    }
    return null;
  }

  create$(requestPayload) {
    // clear
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    // request
    return from(createAnnotation(requestPayload)).pipe(
      switchMap(({ data }) => of({ id: data.id, requestPayload }))
    );
  }

  onKeyupEscape() {
    if (tooltipHandler.isOpen()) {
      selectionHandler.clearSelection();
      tooltipHandler.hide();
    }
  }
}
