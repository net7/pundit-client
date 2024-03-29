import { LayoutDataSource, _t } from '@net7/core';
import {
  from, of, BehaviorSubject, Observable
} from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { difference } from 'lodash';
import {
  Annotation, CommentAnnotation, HighlightAnnotation, Tag
} from '@pundit/communication';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { ToastInstance, ToastService } from 'src/app/services/toast.service';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { TagModel } from 'src/common/models/tag-model';
import { TagService } from 'src/app/services/tag.service';
import { EditModalParams } from 'src/app/types';
import { SemanticPredicateService } from 'src/app/services/semantic-predicate.service';
import { SocialService } from 'src/app/services/social.service';
import { ReplyService } from 'src/app/services/reply.service';
import { PdfService } from 'src/app/services/pdf.service';
import { DocumentInfoService } from 'src/app/services/document-info/document-info.service';
import { AnnotationModel, SemanticPredicateModel } from '../../../common/models';

type MainLayoutState = {
  isLogged: boolean;
  annotation: {
    pendingPayload: HighlightAnnotation | CommentAnnotation;
    updatePayload: Annotation;
    deleteId: string;
  };
  anonymousSelectionRange: Range;
  emailVerifiedToast: ToastInstance;
  identitySyncLoading: boolean;
}

export class MainLayoutDS extends LayoutDataSource {
  public userService: UserService;

  public notebookService: NotebookService;

  public annotationService: AnnotationService;

  public tagService: TagService;

  public socialService: SocialService;

  public replyService: ReplyService;

  public semanticPredicateService: SemanticPredicateService;

  public anchorService: AnchorService;

  public punditLoginService: PunditLoginService;

  public toastService: ToastService;

  public pdfService: PdfService;

  public documentInfoService: DocumentInfoService;

  /** Let other layouts know that all services are ready */
  public hasLoaded$ = new BehaviorSubject(false);

  public pendingAnnotationId = 'pending-id';

  public state: MainLayoutState = {
    isLogged: false,
    annotation: {
      pendingPayload: null,
      updatePayload: null,
      deleteId: null
    },
    anonymousSelectionRange: null,
    emailVerifiedToast: null,
    identitySyncLoading: false
  };

  public usersList = []

  onInit(payload) {
    this.userService = payload.userService;
    this.notebookService = payload.notebookService;
    this.annotationService = payload.annotationService;
    this.tagService = payload.tagService;
    this.socialService = payload.socialService;
    this.replyService = payload.replyService;
    this.anchorService = payload.anchorService;
    this.punditLoginService = payload.punditLoginService;
    this.toastService = payload.toastService;
    this.semanticPredicateService = payload.semanticPredicateService;
    this.pdfService = payload.pdfService;
    this.documentInfoService = payload.documentInfoService;
  }

  isUserLogged = () => this.state.isLogged;

  getPublicData() {
    return this.documentInfoService.get().pipe(
      switchMap((info) => {
        const { pageContext, pageMetadata } = info;
        return from(AnnotationModel.search(pageContext, pageMetadata, true)).pipe(
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
      })
    );
  }

  getUserAnnotations() {
    return this.documentInfoService.get().pipe(
      switchMap((info) => {
        const { pageContext, pageMetadata } = info;
        return from(AnnotationModel.search(pageContext, pageMetadata)).pipe(
          tap(({ data: searchData }) => {
            this.handleSearchResponse(searchData);
            this.hasLoaded$.next(true);
          })
        );
      })
    );
  }

  getUserTags() {
    return from(TagModel.get()).pipe(
      tap(({ data: tags }) => {
        this.tagService.load(tags);
      })
    );
  }

  getUserSemanticPredicates() {
    return from(SemanticPredicateModel.get()).pipe(
      tap(({ data }) => {
        this.semanticPredicateService.load(data);
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
   * Open the edit modal
   * @param textQuote The highlighted string of text
   * @param sections (required) modal form sections
   * @param saveButtonLabel (optional) save button label
   */
  public openEditModal({
    textQuote, saveButtonLabel, sections, validation
  }: EditModalParams) {
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();

    // update component
    this.one('edit-modal').update({
      textQuote, saveButtonLabel, sections, validation
    });
  }

  public setAnonymousSelectionRange() {
    // update state
    this.state.anonymousSelectionRange = selectionModel.getCurrentRange();
    // clear
    selectionModel.clearSelection();
    tooltipModel.hide();
  }

  public setDefaultNotebook() {
    const currentNotebookId = this.notebookService.getSelected()?.id;
    if (!currentNotebookId || !this.notebookService.getNotebookById(currentNotebookId)) {
      const { id: userId } = this.userService.whoami();
      const firstNotebook = this.notebookService.getByUserId(userId)[0];
      this.notebookService.setSelected(firstNotebook.id);
    }
  }

  public checkUserVerified(user) {
    if (!user.is_verified) {
      this.openEmailVerifiedToast();
    } else {
      this.closeEmailVerifiedToast();
    }
  }

  public closeEmailVerifiedToast() {
    if (this.state.emailVerifiedToast) {
      this.state.emailVerifiedToast.close();
      this.state.emailVerifiedToast = null;
    }
  }

  private openEmailVerifiedToast() {
    if (!this.state.emailVerifiedToast) {
      this.state.emailVerifiedToast = this.toastService.warn({
        title: _t('toast#verify_email_title'),
        text: _t('toast#verify_email_text'),
        autoClose: false,
        hasDismiss: false,
        actions: [{
          text: _t('toast#verify_email_action'),
          payload: 'mailverify'
        }],
        onAction: (payload) => {
          if (payload === 'mailverify') {
            this.doEmailVerifyRequest();
          }
        }
      });
    }
  }

  private doEmailVerifyRequest() {
    this.state.emailVerifiedToast.close();
    // working toast
    const workingToast = this.toastService.working();
    // TODO Vedere verify
    this.punditLoginService.verifyEmail().subscribe((response: any) => {
      workingToast.close();
      if ('mail' in response) {
        this.toastService.success({
          title: _t('toast#verify_email_success_title'),
          text: _t('toast#verify_email_success_text', {
            mail: response.mail
          }),
          autoClose: false
        });
      } else {
        console.warn('Email verify response error', response);
        this.toastService.error({
          title: _t('toast#genericerror_title'),
          text: _t('toast#genericerror_text'),
          autoClose: false
        });
      }
    });
  }

  private handleSearchResponse(searchData) {
    const {
      users, annotations, notebooks, socials, replies
    } = searchData;
    // update notebooks
    this.notebookService.load(notebooks);
    // load order matters
    this.userService.load(users);
    this.socialService.load(socials);
    this.replyService.load(replies);
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
      this.socialService.removeCachedAndStats(annotationId);
      this.replyService.removeCachedByAnnotationId(annotationId);
      this.annotationService.removeCached(annotationId);
      this.anchorService.remove(annotationId);
    });
  }

  public addPendingAnnotation$(): Observable<Annotation> {
    return this.annotationService.getAnnotationRequestPayload$().pipe(
      switchMap((pendingPayload: HighlightAnnotation) => {
        this.state.annotation.pendingPayload = pendingPayload;
        const pendingAnnotation = this.annotationService.getAnnotationFromPayload(
          this.pendingAnnotationId,
          this.state.annotation.pendingPayload
        );
        this.removePendingAnnotation();
        this.anchorService.add(pendingAnnotation);
        return of(pendingAnnotation);
      })
    );
  }

  updateShareModal(openModal = false) {
    const notebook = this.notebookService.getSelected();
    notebook.users = this.usersList;
    if (openModal) {
      this.one('notebook-share-modal').update(notebook);
    }
  }
}

export type OpenModalParams = {
  textQuote: string;
  notebookData?: NotebookData;
  comment?: {
    visible: boolean;
    value?: string;
  };
  tags?: {
    values?: Tag[];
    visible: boolean;
  };
}
