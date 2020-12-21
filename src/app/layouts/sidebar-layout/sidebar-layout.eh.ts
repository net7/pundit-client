import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayoutEvent } from '../main-layout/main-layout';
import { SidebarLayoutDS } from './sidebar-layout.ds';

export class SidebarLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private annotationService: AnnotationService;

  public dataSource: SidebarLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.init':
          this.annotationService = payload.annotationService;
          this.dataSource.onInit();
          this.layoutEvent$ = payload.layoutEvent$;
          this.listenLayoutEvents();
          break;
        case 'sidebar-layout.destroy':
          this.destroy$.next();
          break;
        case 'sidebar-layout.clicklogo':
          // open the sidebar
          this.dataSource.isCollapsed.next(false);
          break;
        case 'sidebar-layout.sidebarclose':
          // Close the sidebar
          this.dataSource.isCollapsed.next(true);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
    // this.outerEvents$.subscribe(({ type, payload }) => {
    //   switch (type) {
    //     default:
    //       break;
    //   }
    // });
  }

  private listenLayoutEvents() {
    this.layoutEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type }) => {
      switch (type) {
        case 'searchresponse':
          this.dataSource.loadAnnotations(this.annotationService.getAnnotations());
          break;
        default:
          break;
      }
    });
  }
}
