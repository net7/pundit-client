import { Injectable } from '@angular/core';
import {
  Annotation,
  AnnotationAttributes,
  AnnotationType,
  CommentAnnotation,
  HighlightAnnotation,
  LinkAnnotation
} from '@pundit/communication';
import {
  Subject, from, BehaviorSubject, Observable, of
} from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { _c } from '../models/config';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';
import { AnnotationModel } from '../../common/models';
import { createRequestPayload } from '../models/annotation';
import { PdfService } from './pdf.service';
import { DocumentInfoService } from './document-info/document-info.service';

export enum AnnotationCssClass {
  Empty = '',
  Delete = 'is-deleted',
  Edit = 'is-edited'
}

export type AnnotationState = {
  id: string;
  activeMenu?: string;
  isNotebookSelectorLoading: boolean;
  source: 'box';
  isCollapsed: boolean;
}

export type AnnotationConfig = {
  id: string;
  state$: BehaviorSubject<AnnotationState>;
  data$: BehaviorSubject<Annotation>;
}
@Injectable()
export class AnnotationService {
  private annotations: AnnotationConfig[] = [];

  private rawAnnotations: Annotation[] = [];

  public totalChanged$: Subject<number> = new Subject();

  public showPageAnnotations$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private userService: UserService,
    private notebookService: NotebookService,
    private pdfService: PdfService,
    private documentInfoService: DocumentInfoService,
  ) { }

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
    const currentAnnotation = this.getAnnotationById(rawAnnotation.id);
    // if annotation exists update auth related info
    if (currentAnnotation) {
      const { data$ } = this.getAnnotationById(rawAnnotation.id);
      // reset state classes
      this.updateAnnotationState(rawAnnotation.id, {
        classes: AnnotationCssClass.Empty
      });
      // update annotation data
      data$.next(rawAnnotation);
    } else {
      const { id } = rawAnnotation;
      const data$ = new BehaviorSubject<Annotation>(rawAnnotation);
      const state$ = new BehaviorSubject<any>({
        id: rawAnnotation.id,
        activeMenu: undefined,
        isNotebookSelectorLoading: false,
        source: 'box',
        isCollapsed: true,
      });
      this.annotations.push({ id, data$, state$ });
      this.rawAnnotations.push(rawAnnotation);
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
          const { created, changed, uri } = cachedAnnotation.data$.getValue();
          cachedAnnotation.data$.next({
            ...data, id: annotationId, created, changed, uri
          });
        })
      );
  }

  updateAnnotationState(annotationId: string, state: any): void {
    const cachedAnnotation = this.getAnnotationById(annotationId);
    if (!cachedAnnotation) return;
    const { state$ } = cachedAnnotation;
    const currentState = state$.getValue();
    const newState: AnnotationState = { ...currentState, ...state };
    state$.next(newState);
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
    // update annotations array
    const index = this.annotations.map(({ id }) => id).indexOf(annotationId);
    this.annotations.splice(index, 1);
    // update rawAnnotations array
    const rawIndex = this.rawAnnotations.map(({ id }) => id).indexOf(annotationId);
    this.rawAnnotations.splice(rawIndex, 1);
    // emit signal
    this.totalChanged$.next(this.annotations.length);
  }

  getAnnotationById(annotationId: string): AnnotationConfig | null {
    return this.annotations.find(({ id }) => id === annotationId) || null;
  }

  getAnnotations() {
    return this.annotations
      .sort((a, b) => {
        const aAnnotation = a.data$.getValue();
        const bAnnotation = b.data$.getValue();
        const aCreated = aAnnotation.created;
        const bCreated = bAnnotation.created;
        return new Date(aCreated).getTime() - new Date(bCreated).getTime();
      });
  }

  getAnnotationsToShow() {
    const showPageAnnotations = this.showPageAnnotations$.getValue();
    return this.annotations
      .filter((a) => !!a.data$.getValue().subject?.selected === !showPageAnnotations)
      .sort((a, b) => {
        const aAnnotation = a.data$.getValue();
        const bAnnotation = b.data$.getValue();
        const aCreated = aAnnotation.created;
        const bCreated = bAnnotation.created;
        const aStartPosition = aAnnotation.subject.selected?.textPositionSelector?.start;
        const bStartPosition = bAnnotation.subject.selected?.textPositionSelector?.start;

        if (aStartPosition === bStartPosition) {
          return new Date(aCreated).getTime() - new Date(bCreated).getTime();
        }
        return aStartPosition - bStartPosition;
      });
  }

  getRawAnnotations = () => this.rawAnnotations;

  getAnnotationFromPayload(id: string, payload: AnnotationAttributes) {
    const {
      notebookId,
      subject,
      type,
      tags
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
      tags,
      serializedBy: _c('serializer')
    } as Annotation;
    if (payload.type === 'Commenting') {
      (newAnnotation as CommentAnnotation).content = payload.content;
    }
    if (payload.type === 'Linking') {
      (newAnnotation as LinkAnnotation).content = payload.content;
    }
    return newAnnotation;
  }

  getAnnotationRequestPayload$(
    type: AnnotationType = 'Highlighting'
  ): Observable<HighlightAnnotation | CommentAnnotation> {
    const range = selectionModel.getCurrentRange();
    const userId = this.userService.whoami().id;
    const selectedNotebookId = this.notebookService.getSelected().id;
    const options = {};
    return this.documentInfoService.get().pipe(
      switchMap((documentInfo) => of(createRequestPayload({
        userId,
        type,
        options,
        documentInfo,
        notebookId: selectedNotebookId,
        selection: range,
      })))
    );
  }

  // getFullPageAnnotationRequestPayload(type: AnnotationType = 'Highlighting') {
  //   const userId = this.userService.whoami().id;
  //   const selectedNotebookId = this.notebookService.getSelected().id;
  //   const options = {};
  //   return createRequestPayload({
  //     userId,
  //     type,
  //     options,
  //     notebookId: selectedNotebookId,
  //     selection: undefined,
  //   });
  // }

  clear() {
    this.annotations = [];
  }
}
