import { EventHandler, _t } from '@n7-frontend/core';
import {
  fromEvent, Subject, ReplaySubject, EMPTY, of
} from 'rxjs';
import {
  catchError, debounceTime, delay, filter, first, switchMapTo, takeUntil
} from 'rxjs/operators';
import { PunditLoginService } from '@pundit/login';
import { _c } from 'src/app/models/config';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { UserService } from 'src/app/services/user.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { AppEventData } from 'src/app/types';
import { ToastService } from 'src/app/services/toast.service';
import {
  AnchorEvent,
  AppEvent,
  CommentModalEvent,
  DeleteModalEvent,
  DocumentEvent,
  getEventType,
  MainLayoutEvent,
  TooltipEvent
} from 'src/app/events';
import { MainLayoutDS } from './main-layout.ds';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private appEvent$: ReplaySubject<AppEventData>;

  private userService: UserService;

  private anchorService: AnchorService;

  private punditLoginService: PunditLoginService;

  private toastService: ToastService;

  public dataSource: MainLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case MainLayoutEvent.Init:
          this.appEvent$ = payload.appEvent$;
          this.userService = payload.userService;
          this.anchorService = payload.anchorService;
          this.punditLoginService = payload.punditLoginService;
          this.toastService = payload.toastService;
          this.dataSource.onInit(payload);
          this.listenSelection();
          this.listenAppEvents();
          this.listenAnchorEvents();
          this.listenLoginEvents();

          // user logged
          if (this.userService.whoami()) {
            this.emitInner(getEventType(MainLayoutEvent.GetUserData));
          } else {
            this.loginAlert();
            this.emitInner(getEventType(MainLayoutEvent.GetPublicData));
          }
          break;

        case MainLayoutEvent.Destroy:
          this.destroy$.next();
          break;

        case MainLayoutEvent.GetPublicData:
          this.dataSource.getPublicData().pipe(
            catchError((err) => {
              console.warn('PublicData error:', err);
              return of(null);
            })
          ).subscribe(() => {
            // signal
            this.appEvent$.next({
              type: AppEvent.SearchResponse
            });
          });
          break;
        case MainLayoutEvent.GetUserData:
          this.dataSource.getUserData().pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            }),
          ).subscribe(() => {
            this.appEvent$.next({
              type: AppEvent.SearchResponse
            });
          });
          break;
        default:
          break;
      }
    });

    this.outerEvents$.pipe(
      filter(() => {
        if (!this.dataSource.isUserLogged()) {
          this.punditLoginService.start();
        }
        return true;
      })
    ).subscribe(({ type, payload }) => {
      switch (type) {
        /**
         * Tooltip Events
         * --------------------------------------------------------------------> */
        case TooltipEvent.Click: {
          if (payload === 'highlight') {
            this.dataSource.onTooltipHighlight().pipe(
              catchError((e) => {
                this.handleError(e);

                // toast
                this.toastService.error({
                  title: _t('toast#annotationsave_error_title'),
                  text: _t('toast#annotationsave_error_text'),
                });
                return EMPTY;
              })
            ).subscribe((newAnnotation) => {
              // signal
              this.appEvent$.next({
                type: AppEvent.AnnotationCreateSuccess,
                payload: newAnnotation
              });

              // toast
              this.toastService.success({
                title: _t('toast#annotationsave_success_title'),
                text: _t('toast#annotationsave_success_text'),
              });
            });
          } else if (payload === 'comment') {
            this.dataSource.onTooltipComment();
          }
          break;
        }
        /**
         * CommentModal Events
         * --------------------------------------------------------------------> */
        case CommentModalEvent.TextChange:
          this.dataSource.onCommentModalTextChange(payload);
          break;
        case CommentModalEvent.NotebookChange:
          this.dataSource.onCommentModalNotebookChange(payload);
          break;
        case CommentModalEvent.CreateNotebook:
          this.dataSource.onCommentModalCreateNotebook(payload).pipe(
            catchError((e) => {
              this.handleError(e);

              // toast
              this.toastService.error({
                title: _t('toast#genericerror_error_title'),
                text: _t('toast#genericerror_error_text'),
              });
              return EMPTY;
            })
          ).subscribe(({ notebookList, selectedNotebook }) => {
            // signal
            this.emitOuter(getEventType(MainLayoutEvent.UpdateNotebookSelect), {
              notebookList,
              selectedNotebook
            });
          });
          break;
        case CommentModalEvent.Save: {
          this.dataSource.onCommentModalSave().pipe(
            catchError((e) => {
              this.handleError(e);

              // toast
              this.toastService.error({
                title: _t('toast#genericerror_error_title'),
                text: _t('toast#genericerror_error_text'),
              });
              return EMPTY;
            }),
            filter((data) => data)
          ).subscribe(({ isUpdate, requestPayload }) => {
            if (isUpdate) {
              // signal
              this.appEvent$.next({
                type: AppEvent.CommentUpdate,
                payload: requestPayload
              });
            } else {
              // toast
              this.toastService.success({
                title: _t('toast#annotationsave_success_title'),
                text: _t('toast#annotationsave_success_text'),
              });
            }
          });
          break;
        }
        case CommentModalEvent.Close:
          this.dataSource.onCommentModalClose();
          break;
        /**
         * DeleteModal Events
         * --------------------------------------------------------------------> */
        case DeleteModalEvent.Confirm:
          this.dataSource.onDeleteModalConfirm().pipe(
            catchError((e) => {
              this.handleError(e);

              // toast
              this.toastService.error({
                title: _t('toast#annotationdelete_error_title'),
                text: _t('toast#annotationdelete_error_text'),
              });
              return EMPTY;
            })
          ).subscribe((deleteId) => {
            // signal
            this.appEvent$.next({
              type: AppEvent.AnnotationDeleteSuccess,
              payload: deleteId
            });

            // toast
            this.toastService.info({
              title: _t('toast#annotationdelete_success_title'),
              text: _t('toast#annotationdelete_success_text'),
            });
          });
          break;
        case DeleteModalEvent.Close:
          this.dataSource.onDeleteModalClose();
          break;
        default:
          break;
      }
    });
  }

  listenSelection() {
    const mouseDown$ = fromEvent(document, DocumentEvent.MouseDown);
    const mouseUp$ = fromEvent(document, DocumentEvent.MouseUp);
    const selectionChanged$ = selectionModel.changed$;

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
          this.dataSource.onAnnotationDeleteClick(payload);
          this.emitOuter(getEventType(MainLayoutEvent.AnnotationDeleteClick));
          break;
        case AppEvent.AnnotationMouseEnter:
          this.dataSource.onAnnotationMouseEnter(payload);
          break;
        case AppEvent.AnnotationMouseLeave:
          this.dataSource.onAnnotationMouseLeave(payload);
          break;
        case AppEvent.AnnotationEditComment:
          this.dataSource.onAnnotationEditComment(payload);
          break;
        case AppEvent.SidebarCollapse:
          this.dataSource.onSidebarCollapse(payload);
          break;
        case AppEvent.Logout:
          this.dataSource.onLogout();
          this.appEvent$.next({
            type: AppEvent.Clear
          });
          this.emitInner(getEventType(MainLayoutEvent.GetPublicData));
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
        this.dataSource.onAuth(val);
        // toast
        this.toastService.success({
          title: _t('toast#login_success_title'),
          text: _t('toast#login_success_text'),
        });
        // signal
        this.emitInner(getEventType(MainLayoutEvent.GetUserData));
      }
    });

    this.userService.logged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isLogged) => {
      this.dataSource.onUserLogged(isLogged);
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
