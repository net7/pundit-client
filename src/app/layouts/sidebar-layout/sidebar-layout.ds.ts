import { LayoutDataSource } from '@n7-frontend/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';

export class SidebarLayoutDS extends LayoutDataSource {
  private annotationService: AnnotationService;

  private annotationPositionService: AnnotationPositionService;

  /** open/close the sidebar */
  public isCollapsed = new BehaviorSubject(false);

  /** open/close the notebook editor panel */
  public notebookEditor = new BehaviorSubject(false);

  /** dynamically update the document height on scroll */
  public height$: Subject<string> = new Subject();

  onInit(payload) {
    this.annotationService = payload.annotationService;
    this.annotationPositionService = payload.annotationPositionService;
    this.one('notebook-panel').update({
      active: 'my active notebook',
      status: 'public',
      list: [
        'i am a notebook',
        'wow, me too',
        'my active notebook',
        'just another notebook'
      ]
    });
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
