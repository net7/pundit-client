import { Injectable } from '@angular/core';
import { Annotation, AnnotationAttributes, CommentAnnotation } from '@pundit/communication';
import { Subject } from 'rxjs';
import { AnnotationDS } from '../data-sources';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';

export type AnnotationConfig = {
  id: string;
  ds: AnnotationDS;
  data: Annotation;
}

@Injectable()
export class AnnotationService {
  private annotations: AnnotationConfig[] = [];

  public totalChanged$: Subject<number> = new Subject();

  constructor(
    private userService: UserService,
    private notebookService: NotebookService
  ) {}

  load(rawAnnotations: Annotation[]) {
    rawAnnotations.forEach((rawAnnotation) => {
      this.add(rawAnnotation);
    });
  }

  add(rawAnnotation: Annotation) {
    const currentUser = this.userService.whoami();
    // if annotation exists remove first
    if (this.getAnnotationById(rawAnnotation.id)) {
      this.remove(rawAnnotation.id);
    }

    const { id } = rawAnnotation;
    const data = rawAnnotation;
    const ds = new AnnotationDS();
    // update datasource options
    const currentUserNotebooks = currentUser
      ? this.notebookService.getByUserId(currentUser.id)
      : [];
    const annotationUser = this.userService.getUserById(rawAnnotation.userId) || {} as any;
    const annotationNotebook = this.notebookService.getNotebookById(rawAnnotation.notebookId);
    ds.options = {
      currentUser,
      currentUserNotebooks,
      annotationUser,
      annotationNotebook,
      notebookService: this.notebookService,
    };
    this.annotations.push({
      id, data, ds
    });
    // first datasource update
    ds.update(data);

    // emit signal
    this.totalChanged$.next(this.annotations.length);
  }

  /**
   * Update a cached annotation.
   * To change the data on the backend use "../models/annotation/update" instead!
   * @param annotationId id of the annotation to update
   * @param data data of the annotation that you want to change
   */
  update(annotationId: string, data) {
    const annotation = this.getAnnotationById(annotationId);
    if (!annotation) return;

    const { notebookId, comment } = data;
    const notebookData = this.notebookService.getNotebookById(notebookId);
    // update the notebook
    annotation.ds.updateNotebook(notebookId, notebookData);
    // update comment
    annotation.ds.updateComment(comment);
  }

  remove(annotationId: string) {
    const index = this.annotations.map(({ id }) => id).indexOf(annotationId);
    this.annotations.splice(index, 1);

    // emit signal
    this.totalChanged$.next(this.annotations.length);
  }

  getAnnotationById(annotationId: string): AnnotationConfig | null {
    return this.annotations.find(({ id }) => id === annotationId) || null;
  }

  getAnnotations() {
    return this.annotations.sort((a, b) => {
      const aMeta = a.ds.output._meta;
      const bMeta = b.ds.output._meta;
      const { created: aCreated, startPosition: aStartPosition } = aMeta;
      const { created: bCreated, startPosition: bStartPosition } = bMeta;
      if (aStartPosition === bStartPosition) {
        return aCreated - bCreated;
      }
      return aStartPosition - bStartPosition;
    });
  }

  getAnnotationFromPayload(id: string, payload: AnnotationAttributes) {
    const {
      notebookId,
      subject,
      type
    } = payload;
    const userId = this.userService.whoami().id;
    const created = new Date();
    const newAnnotation = {
      id,
      notebookId,
      userId,
      subject,
      created,
      type
    } as Annotation;
    if (payload.type === 'Commenting') {
      (newAnnotation as CommentAnnotation).content = payload.content;
    }
    return newAnnotation;
  }

  clear() {
    this.annotations = [];
  }
}
