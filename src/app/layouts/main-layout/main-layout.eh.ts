import { EventHandler } from '@n7-frontend/core';
import {
  fromEvent, Subject, ReplaySubject, EMPTY, BehaviorSubject
} from 'rxjs';
import {
  catchError, debounceTime, switchMap, switchMapTo, takeUntil, withLatestFrom
} from 'rxjs/operators';
import { CommentAnnotation } from '@pundit/communication';
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
import { MainLayoutDS } from './main-layout.ds';

const PENDING_ANNOTATION_ID = 'pending-id';

const SIDEBAR_EXPANDED_CLASS = 'pnd-annotation-sidebar-expanded';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  private punditLoginService: PunditLoginService;

  private tokenService: TokenService;

  private changeDetectorRef: ChangeDetectorRef;

  private isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public dataSource: MainLayoutDS;

  private commentState: {
    comment: string | null;
    notebookId: string | null;
  };

  private pendingAnnotationPayload: CommentAnnotation;

  private annotationIdToDelete: string;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'main-layout.init':
          this.layoutEvent$ = payload.layoutEvent$;
          this.userService = payload.userService;
          this.notebookService = payload.notebookService;
          this.annotationService = payload.annotationService;
          this.anchorService = payload.anchorService;
          this.punditLoginService = payload.punditLoginService;
          this.tokenService = payload.tokenService;
          this.changeDetectorRef = payload.changeDetectorRef;
          this.dataSource.onInit(payload);

          // user logged
          if (this.userService.whoami()) {
            this.onLogin();
          } else {
            this.dataSource.hasLoaded.next(true);
            this.annotationService.totalChanged$.next(0);
          }
          this.listenSelection();
          this.listenLayoutEvents();
          this.listenAnchorEvents();
          this.listenLoginEvents();
          break;

        case 'main-layout.destroy':
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
        case 'tooltip.highlight': {
          if (!isLogged) {
            this.punditLoginService.start();
          } else {
            const requestPayload = this.dataSource.getAnnotationRequestPayload();
            this.saveAnnotation(requestPayload);
          }
          break;
        }
        case 'tooltip.comment': {
          if (!isLogged) {
            this.punditLoginService.start();
          } else {
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
            this.dataSource.onComment({ selected: pendingAnnotation.subject.selected.text });
          }
          break;
        }
        case 'comment-modal.change':
          this.commentState.comment = payload;
          break;
        case 'comment-modal.notebook':
          this.commentState.notebookId = payload;
          break;
        case 'comment-modal.save': {
          const requestPayload = this.dataSource.getCommentRequestPayload(
            this.pendingAnnotationPayload,
            this.commentState
          );
          if (requestPayload) {
            // save
            this.saveAnnotation(requestPayload);
          }
          break;
        }
        case 'comment-modal.close':
          // clear pending
          this.removePendingAnnotation();
          break;
        case 'delete-modal.ok':
          this.dataSource.onAnnotationDelete(this.annotationIdToDelete).pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            })
          ).subscribe(() => {
            this.anchorService.remove(this.annotationIdToDelete);
            // signal
            this.layoutEvent$.next({
              type: 'annotationdeletesuccess',
              payload: this.annotationIdToDelete
            });
          });
          break;
        case 'delete-modal.close':
          this.annotationIdToDelete = null;
          break;
        default:
          break;
      }
    });
  }

  listenSelection() {
    const mouseDown$ = fromEvent(document, 'mousedown');
    const mouseUp$ = fromEvent(document, 'mouseup');
    const selectionChanged$ = selectionHandler.changed$;

    mouseDown$.pipe(
      switchMapTo(selectionChanged$),
      switchMapTo(mouseUp$),
      debounceTime(_c('tooltipDelay')),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dataSource.onSelectionChange();
      this.emitOuter('selectionchange', this.dataSource.hasSelection());
    });
  }

  private listenLayoutEvents() {
    this.layoutEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotationdeleteclick':
          this.annotationIdToDelete = payload;
          this.emitOuter('annotationdeleteclick');
          break;
        case 'annotationmouseenter':
          this.anchorService.addHoverClass(payload.id);
          break;
        case 'annotationmouseleave':
          this.anchorService.removeHoverClass(payload.id);
          break;
        case 'sidebarcollapse': {
          const { isCollapsed } = payload;
          if (isCollapsed) {
            document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
          } else {
            document.body.classList.add(SIDEBAR_EXPANDED_CLASS);
          }
          break;
        }
        case 'logout':
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
        case 'mouseover':
          this.layoutEvent$.next({ type: 'anchormouseover', payload });
          break;
        case 'mouseleave':
          this.layoutEvent$.next({ type: 'anchormouseleave', payload });
          break;
        case 'click':
          this.layoutEvent$.next({ type: 'anchorclick', payload });
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
        console.warn('Gestire login error', error);
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
        this.layoutEvent$.next({ type: 'logout' });
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
        return EMPTY;
      })
    ).subscribe(({ id, requestPayload }) => {
      const newAnnotation = this.annotationService.getAnnotationFromPayload(
        id, requestPayload
      );
      this.anchorService.add(newAnnotation);
      // signal
      this.layoutEvent$.next({ type: 'annotationcreatesuccess', payload: newAnnotation });
      // clear pending
      this.removePendingAnnotation();
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
        const { notebooks } = notebooksData;
        this.notebookService.load(notebooks);
        if (!this.notebookService.getSelected()) {
          // first notebook as default
          const { id } = notebooks[0];
          this.notebookService.setSelected(id);
        }

        return this.dataSource.getUserAnnotations();
      }),
      catchError((e) => {
        this.handleError(e);
        return EMPTY;
      })
    ).subscribe(({ data: searchData }) => {
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
      this.layoutEvent$.next({ type: 'searchresponse' });
      this.dataSource.hasLoaded.next(true);
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
    this.layoutEvent$.next({ type: 'clear' });
    this.dataSource.hasLoaded.next(true);
  }
}
