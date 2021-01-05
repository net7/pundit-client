import { LayoutDataSource } from '@n7-frontend/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';

export class SidebarLayoutDS extends LayoutDataSource {
  private annotationService: AnnotationService;

  private annotationPositionService: AnnotationPositionService;

  public isCollapsed = new BehaviorSubject(false);

  public height$: Subject<string> = new Subject();

  onInit(payload) {
    this.annotationService = payload.annotationService;
    this.annotationPositionService = payload.annotationPositionService;
  }

  updateAnnotations(load = false) {
    if (load) {
      this.one('annotation').update(this.annotationService.getAnnotations());
    }

    // fix elements load delay
    setTimeout(() => {
      this.annotationPositionService.update();
    });
  }
}
