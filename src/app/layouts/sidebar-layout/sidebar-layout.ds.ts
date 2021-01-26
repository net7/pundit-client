import { LayoutDataSource } from '@n7-frontend/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';
import { NotebookService } from '../../services/notebook.service';

export class SidebarLayoutDS extends LayoutDataSource {
  private annotationService: AnnotationService;

  private annotationPositionService: AnnotationPositionService;

  private notebookService: NotebookService;

  /** open/close the sidebar */
  public isCollapsed = new BehaviorSubject(true);

  /** open/close the notebook editor panel */
  public notebookEditor = new BehaviorSubject(false);

  /** dynamically update the document height on scroll */
  public height$: Subject<string> = new Subject();

  onInit(payload) {
    this.annotationService = payload.annotationService;
    this.annotationPositionService = payload.annotationPositionService;
    this.notebookService = payload.notebookService;
    this.one('notebook-panel').update({
      selected: this.notebookService.getSelected(),
      list: this.notebookService.getAll()
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
