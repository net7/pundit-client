import { LayoutDataSource } from '@n7-frontend/core';
import { AnnotationData } from '@n7-frontend/components';
import { BehaviorSubject, Subject } from 'rxjs';

export class SidebarLayoutDS extends LayoutDataSource {
  public isCollapsed = new BehaviorSubject(false);

  public height$: Subject<string> = new Subject();

  onInit() {
    // TODO
  }

  loadAnnotations(annotations: AnnotationData[]) {
    this.one('annotation').update(annotations);
  }
}
