import { EventHandler } from '@n7-frontend/core';
import { fromEvent, Subject, ReplaySubject } from 'rxjs';
import { debounceTime, switchMapTo, takeUntil } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { LayoutEvent } from './main-layout';
import { MainLayoutDS } from './main-layout.ds';

export class MainLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private userService: UserService;

  private notebookService: NotebookService;

  private annotationService: AnnotationService;

  public dataSource: MainLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'main-layout.init':
          this.layoutEvent$ = payload.layoutEvent$;
          this.userService = payload.userService;
          this.notebookService = payload.notebookService;
          this.annotationService = payload.annotationService;

          // FIXME: mettere type definitivi
          this.dataSource.onInit().subscribe(({ users, notebooks, annotations }: any) => {
            // load order matters
            this.userService.load(users);
            this.notebookService.load(notebooks);
            this.annotationService.load(annotations);

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
          this.dataSource.onHighlight();
          break;
        case 'tooltip.comment':
          console.warn('TODO: gestire comment event');
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
          this.dataSource.onAnnotationDelete(payload);
          break;
        default:
          break;
      }
    });
  }
}
