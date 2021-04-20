import { LayoutDataSource } from '@n7-frontend/core';
import {
  from, of, BehaviorSubject, Observable
} from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { difference } from 'lodash';
import {
  Annotation,
  CommentAnnotation,
} from '@pundit/communication';
import { PunditLoginService, PunditLogoutService } from '@pundit/login';
import { environment as env } from 'src/environments/environment';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { TokenService } from 'src/app/services/token.service';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { StorageService } from 'src/app/services/storage-service/storage.service';
import { StorageSyncKey, StorageSyncService } from 'src/app/services/storage-sync.service';
import { ToastService } from 'src/app/services/toast.service';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import * as annotationModel from '../../models/annotation';

type MainLayoutState = {
  isLogged: boolean;
  comment: {
    comment: string;
    notebookId: string;
    isUpdate?: boolean;
    isOpen: boolean;
  };
  annotation: {
    pendingPayload: CommentAnnotation;
    updatePayload: Annotation;
    deleteId: string;
  };
  anonymousSelectionRange: Range;
}

export class MainLayoutDS extends LayoutDataSource {
  public userService: UserService;

  public notebookService: NotebookService;

  public annotationService: AnnotationService;

  public anchorService: AnchorService;

  public tokenService: TokenService;

  public punditLoginService: PunditLoginService;

  public punditLogoutService: PunditLogoutService;

  public toastService: ToastService;

  public storageSyncService: StorageSyncService;

  public storageService: StorageService;

  /** Let other layouts know that all services are ready */
  public hasLoaded$ = new BehaviorSubject(false);

  public pendingAnnotationId = 'pending-id';

  public state: MainLayoutState = {
    isLogged: false,
    comment: {
      comment: null,
      notebookId: null,
      isOpen: false
    },
    annotation: {
      pendingPayload: null,
      updatePayload: null,
      deleteId: null
    },
    anonymousSelectionRange: null
  };

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
    this.annotationService = payload.annotationService;
    this.anchorService = payload.anchorService;
    this.tokenService = payload.tokenService;
    this.punditLoginService = payload.punditLoginService;
    this.toastService = payload.toastService;
    this.punditLogoutService = payload.punditLogoutService;
    this.storageSyncService = payload.storageSyncService;
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

  getUserAnnotations() {
    const uri = getDocumentHref();
    return from(annotationModel.search(uri)).pipe(
      tap(({ data: searchData }) => {
        this.handleSearchResponse(searchData);
        this.hasLoaded$.next(true);
      })
    );
  }

  getUserNotebooks() {
    return this.notebookService.search();
  }

  public saveAnnotation(payload) {
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
    // request
    return this.annotationService.create(payload).pipe(
      switchMap(({ data }) => {
        const { id } = data;
        const newAnnotation = this.annotationService.getAnnotationFromPayload(
          id, payload
        );
        this.anchorService.add(newAnnotation);
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
    // update component

    const defaultNotebook = this.notebookService.getSelected();
    const selectedNotebook = this.notebookService.getNotebookById(this.state.comment.notebookId);
    const currentNotebook = notebookData || selectedNotebook || defaultNotebook;
    const notebooks = this.notebookService.getByUserId(this.userService.whoami().id);
    const newComment = comment || this.state.comment.comment || null;
    this.one('comment-modal').update({
      textQuote, currentNotebook, notebooks, comment: newComment
    });
  }

  public setAnonymousSelectionRange() {
    // update state
    this.state.anonymousSelectionRange = selectionModel.getCurrentRange();
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
  }

  public setDefaultNotebook(id: string) {
    if (id && this.notebookService.getNotebookById(id)) {
      this.notebookService.setSelected(id);
    } else {
      const { id: userId } = this.userService.whoami();
      const firstNotebook = this.notebookService.getByUserId(userId)[0];
      this.notebookService.setSelected(firstNotebook.id);
    }
  }

  public getDefaultNotebookIdFromStorage$(): Observable<string> {
    if (env.chromeExt) {
      return this.getDefaultNotebookIdFromExtStorage$();
    }
    return this.getDefaultNotebookIdFromLocalStorage$();
  }

  private getDefaultNotebookIdFromExtStorage$(): Observable<string> {
    return new Observable((subscriber) => {
      // listen signal from chrome-ext
      window.addEventListener('notebookid.response', (ev: CustomEvent) => {
        const { notebookId } = ev.detail;
        subscriber.next(notebookId);
        subscriber.complete();
      }, false);
      // emit signal to chrome-ext
      const signal = new CustomEvent('notebookid.request');
      window.dispatchEvent(signal);
    });
  }

  private getDefaultNotebookIdFromLocalStorage$(): Observable<string> {
    return of(this.storageSyncService.get(StorageSyncKey.Notebook));
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
      this.annotationService.removeCached(annotationId);
      this.anchorService.remove(annotationId);
    });
  }
}
