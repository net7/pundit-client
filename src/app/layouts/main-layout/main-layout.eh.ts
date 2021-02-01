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
import { MainLayoutDS } from './main-layout.ds';

const PENDING_ANNOTATION_ID = 'pending-id';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  private loginService: PunditLoginService;

  private isLogged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public dataSource: MainLayoutDS;

  private commentState: {
    comment: string | null;
    notebookId: string | null;
  };

  private pendingAnnotationPayload: CommentAnnotation;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'main-layout.init':
          this.layoutEvent$ = payload.layoutEvent$;
          this.userService = payload.userService;
          this.notebookService = payload.notebookService;
          this.annotationService = payload.annotationService;
          this.anchorService = payload.anchorService;
          this.loginService = payload.loginService;
          this.dataSource.onInit(payload);

          this.dataSource.getUserNotebooks().pipe(
            switchMap(({ data: notebooksData }) => {
              const { notebooks } = notebooksData;
              // first notebook as default
              const { id } = notebooks[0];
              this.notebookService.load(notebooks);
              this.notebookService.setSelected(id);

              return this.dataSource.getUserAnnotations();
            }),
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            })
          ).subscribe(({ data: searchData }) => {
            const { users, annotations } = searchData;
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
            this.loginService.start();
          } else {
            const requestPayload = this.dataSource.getAnnotationRequestPayload();
            this.saveAnnotation(requestPayload);
          }
          break;
        }
        case 'tooltip.comment': {
          if (!isLogged) {
            this.loginService.start();
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
        case 'annotationdelete':
          this.dataSource.onAnnotationDelete(payload).pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            })
          ).subscribe(() => {
            this.anchorService.remove(payload);
            // signal
            this.layoutEvent$.next({ type: 'annotationdeletesuccess', payload });
          });
          break;
        case 'annotationmouseenter':
          this.anchorService.addHoverClass(payload.id);
          break;
        case 'annotationmouseleave':
          this.anchorService.removeHoverClass(payload.id);
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
    this.loginService.onAuth().pipe(
      takeUntil(this.destroy$)
    ).subscribe((val) => {
      // FIXME: prendere utente defintivo
      console.warn('FIXME: gestire login', val);
      this.userService.iam({
        id: 'rwpfgj6gsp',
        username: 'johndoe',
        thumb: 'https://placeimg.com/400/600/people'
      });

      this.userService.setToken(val.access_token);

      this.userService.login();
      this.loginService.stop();
    });

    this.userService.logged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isLogged) => {
      this.isLogged$.next(isLogged);
    });
  }

  private handleError(error) {
    console.warn('TODO: error handler', error);
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
}
