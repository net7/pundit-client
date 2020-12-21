import { LayoutDataSource } from '@n7-frontend/core';
import { AnnotationData } from '@n7-frontend/components';
import { BehaviorSubject } from 'rxjs';

export class SidebarLayoutDS extends LayoutDataSource {
  public isCollapsed = new BehaviorSubject(false);

  onInit() {
    // TODO
  }

  loadAnnotations(annotations: AnnotationData[]) {
    this.one('annotation').update(annotations);
  }
}
