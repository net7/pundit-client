import { LayoutDataSource } from '@n7-frontend/core';
import { from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  Annotation,
  AnnotationType,
  CommentAnnotation,
  Notebook
} from '@pundit/communication';
import { PunditLoginService } from '@pundit/login';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { TokenService } from 'src/app/services/token.service';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import * as notebookModel from 'src/app/models/notebook';
import * as annotationModel from 'src/app/models/annotation';

const PENDING_ANNOTATION_ID = 'pending-id';

const SIDEBAR_EXPANDED_CLASS = 'pnd-annotation-sidebar-expanded';

type MainLayoutState = {
  isLogged: boolean;
  comment: {
    comment: string;
    notebookId: string;
    isUpdate?: boolean;
  };
  annotation: {
    pendingPayload: CommentAnnotation;
    updatePayload: Annotation;
    deleteId: string;
  };
}

export class MainLayoutDS extends LayoutDataSource {
  private state: MainLayoutState = {
    isLogged: false,
    comment: {
      comment: null,
      notebookId: null
    },
    annotation: {
      pendingPayload: null,
      updatePayload: null,
      deleteId: null
    }
  };

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  private tokenService: TokenService;

  private punditLoginService: PunditLoginService;

  /** Let other layouts know that all services are ready */
  public hasLoaded$ = new BehaviorSubject(false);

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
    this.annotationService = payload.annotationService;
    this.anchorService = payload.anchorService;
    this.tokenService = payload.tokenService;
    this.punditLoginService = payload.punditLoginService;
  }

  onTooltipHighlight() {
    const requestPayload = this.getAnnotationRequestPayload();
    return this.saveAnnotation(requestPayload);
  }

  onTooltipComment() {
    // reset
    this.state.comment = {
      comment: null,
      notebookId: null
    };
    this.state.annotation.pendingPayload = (
      this.getAnnotationRequestPayload() as CommentAnnotation
    );
    this.addPendingAnnotation();
    const pendingAnnotation = this.annotationService.getAnnotationFromPayload(
      PENDING_ANNOTATION_ID, this.state.annotation.pendingPayload
    );
    this.openCommentModal({ textQuote: pendingAnnotation.subject.selected.text });
  }

  onCommentModalTextChange(payload: string) {
    this.state.comment.comment = payload;
  }

  onCommentModalNotebookChange(payload: string) {
    this.state.comment.notebookId = payload;
  }

  onCommentModalCreateNotebook(payload) {
    const iam = this.userService.whoami().id;
    return from(notebookModel.create({
      data: {
        label: payload,
        sharingMode: 'public',
        userId: iam,
      }
    })).pipe(
      tap(({ data }) => {
        const rawNotebook: Notebook = {
          id: data.id,
          changed: new Date(),
          created: new Date(),
          label: payload,
          sharingMode: 'public',
          userId: iam
        };
        this.notebookService.add(rawNotebook);
        this.state.comment.notebookId = data.id;
      }),
      map(({ data }) => ({
        notebookList: this.notebookService.getByUserId(iam),
        selectedNotebook: this.notebookService.getNotebookById(data.id)
      }))
    );
  }

  onCommentModalSave() {
    const { comment } = this.state.comment;
    let source$ = of(null);
    if (typeof comment === 'string' && comment.trim()) {
      const requestPayload = this.state.annotation.pendingPayload
        ? this.getCommentRequestPayload(
          this.state.annotation.pendingPayload,
          this.state.comment
        ) : this.getCommentRequestPayload(
          this.state.annotation.updatePayload,
          this.state.comment
        );
      if (requestPayload && !this.state.annotation.updatePayload) {
        source$ = this.saveAnnotation(requestPayload);
      } else if (requestPayload && this.state.annotation.updatePayload) {
        source$ = of({ requestPayload, isUpdate: true });
      }
    }
    return source$;
  }

  onCommentModalClose() {
    // clear pending
    this.removePendingAnnotation();
  }

  onDeleteModalConfirm() {
    const { deleteId } = this.state.annotation;
    return from(annotationModel.remove(deleteId)).pipe(
      tap(() => {
        this.anchorService.remove(deleteId);
      }),
      map(() => deleteId)
    );
  }

  onDeleteModalClose() {
    this.state.annotation.deleteId = null;
  }

  onAnnotationDeleteClick(payload) {
    this.state.annotation.deleteId = payload;
  }

  onAnnotationMouseEnter({ id }) {
    this.anchorService.addHoverClass(id);
  }

  onAnnotationMouseLeave({ id }) {
    this.anchorService.removeHoverClass(id);
  }

  onAnnotationEditComment(payload) {
    const annotation = this.annotationService.getAnnotationById(payload);
    const notebookData = this.notebookService.getNotebookById(annotation._meta.notebookId);
    this.state.comment = {
      comment: annotation.comment || null,
      notebookId: null,
      isUpdate: true,
    };
    this.state.annotation.updatePayload = annotation._raw;
    this.openCommentModal({
      notebookData,
      textQuote: annotation.body,
      comment: annotation.comment
    });
  }

  onSidebarCollapse({ isCollapsed }) {
    if (isCollapsed) {
      document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
    } else {
      document.body.classList.add(SIDEBAR_EXPANDED_CLASS);
    }
  }

  onAuth({ token, user }) {
    // set token
    this.tokenService.set(token.access_token);
    // set user
    this.userService.iam({
      ...user,
      id: `${user.id}`
    });
    this.punditLoginService.stop();
  }

  onLogout() {
    // reset
    this.tokenService.clear();
    this.userService.clear();
    this.notebookService.clear();
    this.annotationService.clear();
    this.anchorService.clear();
    this.userService.logout();

    // emit signals
    this.annotationService.totalChanged$.next(0);
    this.hasLoaded$.next(true);
  }

  onUserLogged(isLogged: boolean) {
    this.state.isLogged = isLogged;
  }

  isUserLogged = () => this.state.isLogged;

  onSelectionChange() {
    if (this.hasSelection()) {
      tooltipModel.show(selectionModel.getCurrentSelection());
    } else {
      tooltipModel.hide();
    }
  }

  hasSelection = () => !!selectionModel.getCurrentSelection();

  onKeyupEscape() {
    if (tooltipModel.isOpen()) {
      selectionModel.clearSelection();
      tooltipModel.hide();
    }
  }

  getPublicData() {
    const uri = getDocumentHref();
    return from(annotationModel.search(uri)).pipe(
      tap((response) => {
        const { data: searchData } = response;
        this.handleSearchResponse(searchData);
        this.hasLoaded$.next(true);
      })
    );
  }

  getUserData() {
    return from(notebookModel.search()).pipe(
      switchMap(({ data: notebooksData }) => {
        this.handleUserNotebooksResponse(notebooksData);

        const uri = getDocumentHref();
        return from(annotationModel.search(uri));
      }),
      tap(({ data: searchData }) => {
        this.handleSearchResponse(searchData);
        this.hasLoaded$.next(true);
      })
    );
  }

  private getAnnotationRequestPayload() {
    const range = selectionModel.getCurrentRange();
    const userId = this.userService.whoami().id;
    const selectedNotebookId = this.notebookService.getSelected().id;
    const type: AnnotationType = 'Highlighting';
    const options = {};
    return annotationModel.createRequestPayload({
      userId,
      type,
      options,
      notebookId: selectedNotebookId,
      selection: range,
    });
  }

  private getCommentRequestPayload(payload, { comment, notebookId }) {
    payload.type = 'Commenting';
    payload.content = {
      comment: comment.trim()
    };
    if (notebookId) {
      payload.notebookId = notebookId;
    }
    return payload;
  }

  private handleUserNotebooksResponse(notebooksData) {
    const { notebooks } = notebooksData;
    this.notebookService.load(notebooks);
    if (!this.notebookService.getSelected()) {
      // first notebook as default
      const { id } = notebooks[0];
      this.notebookService.setSelected(id);
    }
  }

  private handleSearchResponse(searchData) {
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

  private saveAnnotation(payload) {
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
    // request
    return from(annotationModel.create(payload)).pipe(
      switchMap(({ data }) => {
        const { id } = data;
        const requestPayload = payload;
        const newAnnotation = this.annotationService.getAnnotationFromPayload(
          id, requestPayload
        );
        this.anchorService.add(newAnnotation);
        // clear pending
        this.removePendingAnnotation();
        return of(newAnnotation);
      })
    );
  }

  private addPendingAnnotation() {
    const pendingAnnotation = this.annotationService.getAnnotationFromPayload(
      PENDING_ANNOTATION_ID, this.state.annotation.pendingPayload
    );
    this.anchorService.add(pendingAnnotation);
  }

  private removePendingAnnotation() {
    this.anchorService.remove(PENDING_ANNOTATION_ID);
  }

  /**
   * Open the comment modal
   * @param textQuote The highlighted string of text
   * @param notebook (optional) The notebook of the annotation
   * @param comment (optional) The existing comment
   */
  private openCommentModal({ textQuote, notebookData, comment }: {
    textQuote: string;
    notebookData?: NotebookData;
    comment?: string;
  }) {
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
    const currentNotebook = notebookData || this.notebookService.getSelected();
    const notebooks = this.notebookService.getByUserId(this.userService.whoami().id);
    this.one('comment-modal').update({
      textQuote, currentNotebook, notebooks, comment
    });
  }
}
