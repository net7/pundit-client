import { EventHandler, _t } from '@n7-frontend/core';
import {
  fromEvent, Subject, ReplaySubject, EMPTY, BehaviorSubject,
  of
} from 'rxjs';
import {
  catchError, debounceTime, delay, filter, first, switchMap, switchMapTo, takeUntil, withLatestFrom
} from 'rxjs/operators';
import { Annotation, CommentAnnotation, Notebook } from '@pundit/communication';
import { PunditLoginService } from '@pundit/login';
import { _c } from 'src/app/models/config';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { LayoutEvent } from 'src/app/types';
import { TokenService } from 'src/app/services/token.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import {
  AnchorEvent,
  AppEvent,
  CommentModalEvent, DeleteModalEvent, DocumentEvent, getEventType, MainLayoutEvent, TooltipEvent
} from 'src/app/events';
import { MainLayoutDS } from './main-layout.ds';
import * as notebook from '../../models/notebook';

const PENDING_ANNOTATION_ID = 'pending-id';

const SIDEBAR_EXPANDED_CLASS = 'pnd-annotation-sidebar-expanded';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private appEvent$: ReplaySubject<LayoutEvent>;

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  private punditLoginService: PunditLoginService;

  private tokenService: TokenService;

  private toastService: ToastService;

  private changeDetectorRef: ChangeDetectorRef;

  private isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public dataSource: MainLayoutDS;

  private commentState: {
    comment: string | null;
    notebookId: string | null;
    isUpdate?: boolean;
  };

  private pendingAnnotationPayload: CommentAnnotation;

  private annotationIdToDelete: string;

  /** request payload that is used when updating an existing annotation */
  private annotationUpdatePayload: Annotation;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.Init:
          this.appEvent$ = payload.appEvent$;
          this.userService = payload.userService;
          this.notebookService = payload.notebookService;
          this.annotationService = payload.annotationService;
          this.anchorService = payload.anchorService;
          this.punditLoginService = payload.punditLoginService;
          this.tokenService = payload.tokenService;
          this.toastService = payload.toastService;
          this.changeDetectorRef = payload.changeDetectorRef;
          this.dataSource.onInit(payload);

          // user logged
          if (this.userService.whoami()) {
            this.onLogin();
          } else {
            this.loginAlert();
            this.loadPublicAnnotations();
          }
          this.listenSelection();
          this.listenAppEvents();
          this.listenAnchorEvents();
          this.listenLoginEvents();
          break;

        case MainLayoutEvent.Destroy:
          this.destroy$.next();
          break;
        default:
          break;
      }
    });

    this.outerEvents$.pipe(
      withLatestFrom(this.isLogged$)
    ).subscribe(([{ type, payload }, isLogged]) => {
      switch (type) {
        /**
         * Tooltip Events
         * --------------------------------------------------------------------> */
        case TooltipEvent.Click: {
          if (!isLogged) {
            this.punditLoginService.start();
          } else if (payload === 'highlight') {
            const requestPayload = this.dataSource.getAnnotationRequestPayload();
            this.saveAnnotation(requestPayload);
          } else if (payload === 'comment') {
            // reset
            this.commentState = {
              comment: null,
              notebookId: null
            };
            this.pendingAnnotationPayload = (
              this.dataSource.getAnnotationRequestPayload() as CommentAnnotation
            );
            this.addPendingAnnotation();
            const pendingAnnotation = this.annotationService.getAnnotationFromPayload(
              PENDING_ANNOTATION_ID, this.pendingAnnotationPayload
            );
            this.dataSource.onComment({ textQuote: pendingAnnotation.subject.selected.text });
          }
          break;
        }
        /**
         * CommentModal Events
         * --------------------------------------------------------------------> */
        case CommentModalEvent.TextChange:
          this.commentState.comment = payload;
          break;
        case CommentModalEvent.NotebookChange:
          this.commentState.notebookId = payload;
          break;
        case CommentModalEvent.CreateNotebook: {
          const iam = this.userService.whoami().id;
          notebook.create({
            data: {
              label: payload,
              sharingMode: 'public',
              userId: iam,
            }
          }).then((res) => {
            const rawNotebook: Notebook = {
              id: res.data.id,
              changed: new Date(),
              created: new Date(),
              label: payload,
              sharingMode: 'public',
              userId: iam
            };
            this.notebookService.add(rawNotebook);
            this.commentState.notebookId = res.data.id;
            // update select
            this.emitOuter('updatenotebookselect', {
              notebookList: this.notebookService.getByUserId(iam),
              selectedNotebook: this.notebookService.getNotebookById(res.data.id)
            });
          });
        } break;
        case CommentModalEvent.Save: {
          const requestPayload = this.pendingAnnotationPayload
            ? this.dataSource.getCommentRequestPayload(
              this.pendingAnnotationPayload,
              this.commentState
            ) : this.dataSource.getCommentRequestPayload(
              this.annotationUpdatePayload,
              this.commentState
            );
          if (requestPayload && !this.annotationUpdatePayload) {
            this.saveAnnotation(requestPayload);
          } else if (requestPayload && this.annotationUpdatePayload) {
            this.appEvent$.next({
              type: AppEvent.CommentUpdate,
              payload: requestPayload
            });
          }
          break;
        }
        case CommentModalEvent.Close:
          // clear pending
          this.removePendingAnnotation();
          break;
        /**
         * DeleteModal Events
         * --------------------------------------------------------------------> */
        case DeleteModalEvent.Confirm:
          this.dataSource.onAnnotationDelete(this.annotationIdToDelete).pipe(
            catchError((e) => {
              this.handleError(e);

              // toast
              this.toastService.error({
                title: _t('toast#annotationdelete_error_title'),
                text: _t('toast#annotationdelete_error_text'),
              });
              return EMPTY;
            })
          ).subscribe(() => {
            this.anchorService.remove(this.annotationIdToDelete);
            // signal
            this.appEvent$.next({
              type: AppEvent.AnnotationDeleteSuccess,
              payload: this.annotationIdToDelete
            });

            // toast
            this.toastService.info({
              title: _t('toast#annotationdelete_success_title'),
              text: _t('toast#annotationdelete_success_text'),
            });
          });
          break;
        case DeleteModalEvent.Close:
          this.annotationIdToDelete = null;
          break;
        default:
          break;
      }
    });
  }

  listenSelection() {
    const mouseDown$ = fromEvent(document, DocumentEvent.MouseDown);
    const mouseUp$ = fromEvent(document, DocumentEvent.MouseUp);
    const selectionChanged$ = selectionHandler.changed$;

    mouseDown$.pipe(
      switchMapTo(selectionChanged$),
      switchMapTo(mouseUp$),
      debounceTime(_c('tooltipDelay')),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dataSource.onSelectionChange();
      this.emitOuter(getEventType(MainLayoutEvent.SelectionChange), this.dataSource.hasSelection());
    });
  }

  private listenAppEvents() {
    this.appEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case AppEvent.KeyUpEscape:
          this.dataSource.onKeyupEscape();
          this.emitOuter(getEventType(MainLayoutEvent.KeyUpEscape));
          break;
        case AppEvent.AnnotationDeleteClick:
          this.annotationIdToDelete = payload;
          this.emitOuter(getEventType(MainLayoutEvent.AnnotationDeleteClick));
          break;
        case AppEvent.AnnotationMouseEnter:
          this.anchorService.addHoverClass(payload.id);
          break;
        case AppEvent.AnnotationMouseLeave:
          this.anchorService.removeHoverClass(payload.id);
          break;
        case AppEvent.AnnotationEditComment: {
          const annotation = this.annotationService.getAnnotationById(payload);
          const newnotebook = this.notebookService.getNotebookById(annotation._meta.notebookId);
          this.commentState = {
            comment: annotation.comment || null,
            notebookId: null,
            isUpdate: true,
          };
          this.annotationUpdatePayload = annotation._raw;
          this.dataSource.onComment({
            textQuote: annotation.body,
            notebook: newnotebook,
            comment: annotation.comment
          });
        } break;
        case AppEvent.SidebarCollapse: {
          const { isCollapsed } = payload;
          if (isCollapsed) {
            document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
          } else {
            document.body.classList.add(SIDEBAR_EXPANDED_CLASS);
          }
          break;
        }
        case AppEvent.Logout:
          this.userService.logout();
          this.onLogout();
          break;
        default:
          break;
      }
    });
  }

  private listenAnchorEvents() {
    this.anchorService.events$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case AnchorEvent.MouseOver:
          this.appEvent$.next({
            payload,
            type: AppEvent.AnchorMouseOver
          });
          break;
        case AnchorEvent.MouseLeave:
          this.appEvent$.next({
            payload,
            type: AppEvent.AnchorMouseLeave
          });
          break;
        case AnchorEvent.Click:
          this.appEvent$.next({
            payload,
            type: AppEvent.AnchorClick,
          });
          break;
        default:
          break;
      }
    });
  }

  private listenLoginEvents() {
    this.punditLoginService.onAuth().pipe(
      takeUntil(this.destroy$)
    ).subscribe((val) => {
      if ('error' in val) {
        const { error } = val;
        console.warn('Login error', error);

        // toast
        this.toastService.error({
          title: _t('toast#login_error_title'),
          text: _t('toast#login_error_text'),
        });
      } else if ('user' in val) {
        const { token, user } = val;

        // set token
        this.tokenService.set(token.access_token);

        // set user
        this.userService.iam({
          ...user,
          id: `${user.id}`
        });
        this.punditLoginService.stop();
        this.onLogin();

        // toast
        this.toastService.success({
          title: _t('toast#login_success_title'),
          text: _t('toast#login_success_text'),
        });
      }
    });

    this.userService.logged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isLogged) => {
      this.isLogged$.next(isLogged);
    });
  }

  private handleError(error) {
    const { status } = error.response;
    switch (status) {
      // Unauthorized
      case 401:
        this.appEvent$.next({ type: AppEvent.Logout });
        break;
      default:
        // TODO
        break;
    }
    console.warn('FIXME: error handler', error);
  }

  private saveAnnotation(payload) {
    this.dataSource.create$(payload).pipe(
      catchError((e) => {
        this.handleError(e);

        // toast
        this.toastService.error({
          title: _t('toast#annotationsave_error_title'),
          text: _t('toast#annotationsave_error_text'),
        });
        return EMPTY;
      })
    ).subscribe(({ id, requestPayload }) => {
      const newAnnotation = this.annotationService.getAnnotationFromPayload(
        id, requestPayload
      );
      this.anchorService.add(newAnnotation);
      // signal
      this.appEvent$.next({
        type: AppEvent.AnnotationCreateSuccess,
        payload: newAnnotation
      });
      // clear pending
      this.removePendingAnnotation();

      // toast
      this.toastService.success({
        title: _t('toast#annotationsave_success_title'),
        text: _t('toast#annotationsave_success_text'),
      });
    });
  }

  private addPendingAnnotation() {
    const pendingAnnotation = this.annotationService.getAnnotationFromPayload(
      PENDING_ANNOTATION_ID, this.pendingAnnotationPayload
    );
    this.anchorService.add(pendingAnnotation);
  }

  private removePendingAnnotation() {
    this.anchorService.remove(PENDING_ANNOTATION_ID);
  }

  private onLogin() {
    // restart angular change detection
    if (this.changeDetectorRef) {
      this.changeDetectorRef.detectChanges();
    }

    this.dataSource.getUserNotebooks().pipe(
      switchMap(({ data: notebooksData }) => {
        this.dataSource.handleUserNotebooksResponse(notebooksData);

        return this.dataSource.getUserAnnotations();
      }),
      catchError((e) => {
        const { status } = e.response;
        // on login error load public annotations
        if (status === 401) {
          this.appEvent$.pipe(
            filter(({ type }) => type === 'clear'),
            first()
          ).subscribe(() => {
            this.loginAlert();
            this.loadPublicAnnotations();
          });
        }
        this.handleError(e);
        return EMPTY;
      })
    ).subscribe(({ data: searchData }) => {
      this.dataSource.handleSearchResponse(searchData);
      this.appEvent$.next({
        type: AppEvent.SearchResponse
      });
      this.dataSource.hasLoaded$.next(true);
    });
  }

  private onLogout() {
    // reset
    this.tokenService.clear();
    this.userService.clear();
    this.notebookService.clear();
    this.annotationService.clear();
    this.anchorService.clear();

    // emit signals
    this.annotationService.totalChanged$.next(0);
    this.appEvent$.next({
      type: AppEvent.Clear
    });
    this.dataSource.hasLoaded$.next(true);

    // reload public annotations
    this.loadPublicAnnotations();
  }

  private loadPublicAnnotations() {
    this.dataSource.getPublicAnnotations()
      .pipe(
        catchError((err) => {
          console.warn('PublicAnnotations error:', err);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          const { data: searchData } = response;
          this.dataSource.handleSearchResponse(searchData);
          this.appEvent$.next({
            type: AppEvent.SearchResponse
          });
        }
        this.dataSource.hasLoaded$.next(true);
      });
  }

  private loginAlert() {
    this.dataSource.hasLoaded$.pipe(
      first(),
      delay(1000) // fix render
    ).subscribe(() => {
      const loginToast = this.toastService.warn({
        title: _t('toast#login_warn_title'),
        text: _t('toast#login_warn_text'),
        actions: [{
          text: _t('toast#login_warn_action'),
          payload: 'login'
        }],
        autoClose: false,
        onAction: (payload) => {
          if (payload === 'login') {
            this.punditLoginService.start();
          }
        }
      });

      // on auth close toast
      this.punditLoginService.onAuth().pipe(
        first()
      ).subscribe(() => {
        loginToast.close();
      });
    });
  }
}
