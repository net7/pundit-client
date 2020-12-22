import { EventHandler } from '@n7-frontend/core';
import {
  fromEvent, Subject, ReplaySubject, EMPTY
} from 'rxjs';
import {
  catchError, debounceTime, switchMapTo, takeUntil
} from 'rxjs/operators';
import * as faker from 'faker';
import { _c } from 'src/app/models/config';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { LayoutEvent } from './main-layout';
import { MainLayoutDS } from './main-layout.ds';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  private anchorService: AnchorService;

  public dataSource: MainLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'main-layout.init':
          this.layoutEvent$ = payload.layoutEvent$;
          this.userService = payload.userService;
          this.notebookService = payload.notebookService;
          this.annotationService = payload.annotationService;
          this.anchorService = payload.anchorService;
          this.dataSource.onInit(payload);

          this.dataSource.getUserAnnotations().pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            })
          ).subscribe(({ data }) => {
            const { users, notebooks, annotations } = data;
            // load order matters
            this.userService.load(users);
            this.notebookService.load(notebooks);
            this.annotationService.load(annotations);
            this.anchorService.load(annotations);
            this.anchorService.load(annotations).then(() => console.warn('Highlights loaded'));
            this.layoutEvent$.next({ type: 'searchresponse' });
          });
          this.listenSelection();
          this.listenLayoutEvents();
          break;

        case 'main-layout.destroy':
          this.destroy$.next();
          break;
        default:
          break;
      }
    });

    this.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case 'tooltip.highlight':
        case 'tooltip.comment': {
          // FIXME: togliere faker
          let comment;
          if (type === 'tooltip.comment') {
            comment = faker.lorem.sentence();
          }
          this.dataSource.onHighlightOrComment(comment).pipe(
            catchError((e) => {
              this.handleError(e);
              return EMPTY;
            })
          );
          break;
        }
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
          );
          break;
        default:
          break;
      }
    });
  }

  private handleError(error) {
    console.warn('TODO: error handler', error);
  }
}
