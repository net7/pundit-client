import { ChangeDetectorRef } from '@angular/core';
import { EventHandler } from '@n7-frontend/core';
import { Subject, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayoutEvent } from 'src/app/types';
import { SidebarLayoutDS } from './sidebar-layout.ds';

export class SidebarLayoutEH extends EventHandler {
  private destroy$: Subject<void> = new Subject();

  private layoutEvent$: ReplaySubject<LayoutEvent>;

  private annotationService: AnnotationService;

  private detectorRef: ChangeDetectorRef;

  public dataSource: SidebarLayoutDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.init':
          this.annotationService = payload.annotationService;
          this.layoutEvent$ = payload.layoutEvent$;
          this.detectorRef = payload.detectorRef;

          this.dataSource.onInit(payload);
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

    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.delete':
          this.layoutEvent$.next({ type: 'annotationdelete', payload });
          break;
        case 'annotation.togglecollapse':
          this.dataSource.updateAnnotations();
          break;
        default:
          break;
      }
    });
  }

  private listenLayoutEvents() {
    this.layoutEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case 'searchresponse':
          this.dataSource.updateAnnotations(true);
          break;
        case 'annotationdeletesuccess':
          this.annotationService.remove(payload);
          this.dataSource.updateAnnotations(true);
          break;
        case 'annotationcreatesuccess': {
          this.annotationService.add(payload);
          this.dataSource.updateAnnotations(true);
          break;
        }
        case 'documentresize':
          this.dataSource.height$.next(`${payload}px`);
          // fix update sidebar height
          setTimeout(() => {
            this.detectorRef.detectChanges();
            this.dataSource.updateAnnotations();
          });
          break;
        default:
          break;
      }
    });
  }
}
