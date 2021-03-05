import { LayoutDataSource } from '@n7-frontend/core';
import {
  from, of, BehaviorSubject
} from 'rxjs';
import { selectionModel } from 'src/app/models/selection/selection-model';
import {
  create as createAnnotation, createRequestPayload, remove as deleteAnnotation, search
} from 'src/app/models/annotation';
import { search as searchNotebooks } from 'src/app/models/notebook';
import tooltipModel from 'src/app/models/tooltip-model';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';

import { AnnotationType } from '@pundit/communication';
import { switchMap } from 'rxjs/operators';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';

export class MainLayoutDS extends LayoutDataSource {
  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  /** Let other layouts know that all services are ready */
  public hasLoaded$ = new BehaviorSubject(false);

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
    this.annotationService = payload.annotationService;
    this.anchorService = payload.anchorService;
  }

  getUserAnnotations() {
    const uri = getDocumentHref();
    return from(search(uri));
  }

  getPublicAnnotations() {
    const uri = getDocumentHref();
    return from(search(uri));
  }

  getUserNotebooks() {
    return from(searchNotebooks());
  }

  handleUserNotebooksResponse(notebooksData) {
    const { notebooks } = notebooksData;
    this.notebookService.load(notebooks);
    if (!this.notebookService.getSelected()) {
      // first notebook as default
      const { id } = notebooks[0];
      this.notebookService.setSelected(id);
    }
  }

  handleSearchResponse(searchData) {
    const { users, annotations, notebooks } = searchData;
    // update notebooks
    this.notebookService.load(notebooks);
    // load order matters
    this.userService.load(users);
    this.annotationService.load(annotations);
    this.anchorService.load(annotations);
    // signal
    if (!this.annotationService.getAnnotations().length) {
      this.annotationService.totalChanged$.next(0);
    }
  }

  onSelectionChange() {
    if (this.hasSelection()) {
      tooltipModel.show(selectionModel.getCurrentSelection());
    } else {
      tooltipModel.hide();
    }
  }

  hasSelection = () => !!selectionModel.getCurrentSelection();

  /**
   * Open the comment modal
   * @param textQuote The highlighted string of text
   * @param notebook (optional) The notebook of the annotation
   * @param comment (optional) The existing comment
   */
  onComment({ textQuote, notebook, comment }: {
    textQuote: string;
    notebook?: NotebookData;
    comment?: string;
  }) {
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
    const currentNotebook = notebook || this.notebookService.getSelected();
    const notebooks = this.notebookService.getByUserId(this.userService.whoami().id);
    this.one('comment-modal').update({
      textQuote, currentNotebook, notebooks, comment
    });
  }

  onAnnotationDelete(id: string) {
    const deleteResponse = deleteAnnotation(id);
    return from(deleteResponse);
  }

  getAnnotationRequestPayload() {
    const range = selectionModel.getCurrentRange();
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
    selectionModel.clearSelection();
    tooltipModel.hide();
    // request
    return from(createAnnotation(requestPayload)).pipe(
      switchMap(({ data }) => of({ id: data.id, requestPayload }))
    );
  }

  onKeyupEscape() {
    if (tooltipModel.isOpen()) {
      selectionModel.clearSelection();
      tooltipModel.hide();
    }
  }
}
