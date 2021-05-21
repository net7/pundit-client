import { Injectable } from '@angular/core';
import {
  Annotation, AnnotationAttributes, AnnotationType, CommentAnnotation
} from '@pundit/communication';
import { Subject, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { AnnotationCssClass, AnnotationDS } from '../data-sources';
import { _c } from '../models/config';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';
import { AnnotationModel } from '../../common/models';
import { createRequestPayload } from '../models/annotation';

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

  /**
   * Create a new annotation on the backend
   * and add it to the local cache.
   */
  create(attributes: AnnotationAttributes) {
    return from(AnnotationModel.create(attributes)).pipe(
      tap(({ data }) => {
        const { id } = data;
        const requestPayload = attributes;
        const newAnnotation = this.getAnnotationFromPayload(
          id, requestPayload
        );
        this.add(newAnnotation);
      })
    );
  }

  /**
   * Load an annotation that already exists into the client
   * @param rawAnnotation
   */
  add(rawAnnotation: Annotation) {
    const currentUser = this.userService.whoami();
    const currentAnnotation = this.getAnnotationById(rawAnnotation.id);
    // if annotation exists update auth related info
    if (currentAnnotation) {
      const annotationDS = this.getAnnotationById(rawAnnotation.id).ds;
      annotationDS.options.currentUser = currentUser;
      annotationDS.updateUser();
      annotationDS.updateMenu();
      annotationDS.updateNotebook();
    } else {
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
    }

    // emit signal
    this.totalChanged$.next(this.annotations.length);
  }

  /**
   * Update a cached annotation.
   * To change the data on the backend use "../models/annotation/update" instead!
   * @param annotationId id of the annotation to update
   * @param data data of the annotation that you want to change
   */
  update(annotationId: string, data: AnnotationAttributes) {
    return from(AnnotationModel.update(annotationId, data))
      .pipe(
        tap(() => {
          const cachedAnnotation = this.getAnnotationById(annotationId);
          if (!cachedAnnotation) return;
          if (data.notebookId) {
            // update the notebook
            const { notebookId } = data;
            const notebookData = this.notebookService.getNotebookById(notebookId);
            cachedAnnotation.ds.updateSelectedNotebook(notebookData);
          }
          if (data.type === 'Commenting') {
            // update comment
            cachedAnnotation.ds.updateComment(data.content.comment);
            cachedAnnotation.ds.updateMenu();
          }
        })
      );
  }

  updateCached(annotationId: string, updateData: {
    cssClass: AnnotationCssClass;
  }) {
    const cachedAnnotation = this.getAnnotationById(annotationId);
    if (!cachedAnnotation) return;
    if (typeof updateData.cssClass === 'string') {
      cachedAnnotation.ds.updateCssClass(updateData.cssClass);
    }
  }

  /**
   * Requests to delete the annotation on the backend,
   * then updates the local cache.
   *
   * @param annotationId ID of the annotation to delete
   */
  remove(annotationId: string) {
    return from(AnnotationModel.remove(annotationId)).pipe(
      tap(() => {
        this.removeCached(annotationId);
      })
    );
  }

  removeCached(annotationId: string) {
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
    const created = new Date().toISOString();
    const newAnnotation = {
      id,
      notebookId,
      userId,
      subject,
      created,
      type,
      serializedBy: _c('serializer')
    } as Annotation;
    if (payload.type === 'Commenting') {
      (newAnnotation as CommentAnnotation).content = payload.content;
    }
    return newAnnotation;
  }

  getAnnotationRequestPayload(type: AnnotationType) {
    const range = selectionModel.getCurrentRange();
    const userId = this.userService.whoami().id;
    const selectedNotebookId = this.notebookService.getSelected().id;
    const options = {};
    return createRequestPayload({
      userId,
      type,
      options,
      notebookId: selectedNotebookId,
      selection: range,
    });
  }

  clear() {
    this.annotations = [];
  }
}
