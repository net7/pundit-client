import { LayoutDataSource } from '@n7-frontend/core';
import { from, of, BehaviorSubject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { difference } from 'lodash';
import {
  Annotation,
  CommentAnnotation,
} from '@pundit/communication';
import { PunditLoginService } from '@pundit/login';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { TokenService } from 'src/app/services/token.service';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { ToastService } from 'src/app/services/toast.service';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import * as annotationModel from 'src/app/models/annotation';

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
  public state: MainLayoutState = {
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

  public userService: UserService;

  public notebookService: NotebookService;

  public annotationService: AnnotationService;

  public anchorService: AnchorService;

  public tokenService: TokenService;

  public punditLoginService: PunditLoginService;

  public toastService: ToastService;

  /** Let other layouts know that all services are ready */
  public hasLoaded$ = new BehaviorSubject(false);

  public pendingAnnotationId = 'pending-id';

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
    this.annotationService = payload.annotationService;
    this.anchorService = payload.anchorService;
    this.tokenService = payload.tokenService;
    this.punditLoginService = payload.punditLoginService;
    this.toastService = payload.toastService;
  }

  isUserLogged = () => this.state.isLogged;

  getPublicData() {
    const uri = getDocumentHref();
    return from(annotationModel.search(uri)).pipe(
      tap((response) => {
        const { data: searchData } = response;
        // remove private annotations
        this.removePrivateAnnotations(searchData);
        // handle response
        this.handleSearchResponse(searchData);
        // emit loaded signal
        this.hasLoaded$.next(true);
      })
    );
  }

  getUserData() {
    return this.notebookService.search().pipe(
      switchMap(() => {
        const uri = getDocumentHref();
        return from(annotationModel.search(uri));
      }),
      tap(({ data: searchData }) => {
        this.handleSearchResponse(searchData);
        this.hasLoaded$.next(true);
      })
    );
  }

  public saveAnnotation(payload) {
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

  public removePendingAnnotation() {
    this.anchorService.remove(this.pendingAnnotationId);
  }

  /**
   * Open the comment modal
   * @param textQuote The highlighted string of text
   * @param notebook (optional) The notebook of the annotation
   * @param comment (optional) The existing comment
   */
  public openCommentModal({ textQuote, notebookData, comment }: {
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

  private removePrivateAnnotations(searchData) {
    const { annotations }: { annotations: Annotation[] } = searchData;
    const annotationIds = annotations.map(({ id }) => id);
    const annotationConfigIds = this.annotationService.getAnnotations().map(({ id }) => id);
    difference(annotationConfigIds, annotationIds).forEach((annotationId) => {
      this.annotationService.remove(annotationId);
      this.anchorService.remove(annotationId);
    });
  }
}
