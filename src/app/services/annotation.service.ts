import { Injectable } from '@angular/core';
import { Annotation, AnnotationAttributes, CommentAnnotation } from '@pundit/communication';
import { Subject } from 'rxjs';
import { AnnotationData } from '../components/annotation/annotation';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';

@Injectable()
export class AnnotationService {
  private annotations: AnnotationData[] = [];

  private lastRemoved: AnnotationData;

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
    if (!this.getAnnotationById(rawAnnotation.id)) {
      this.annotations.push(this.transform(rawAnnotation));

      // emit signal
      this.totalChanged$.next(this.annotations.length);
    }
  }

  /**
   * Update a cached annotation.
   * To change the data on the backend use "../models/annotation/update" instead!
   * @param annotationId id of the annotation to update
   * @param data data of the annotation that you want to change
   */
  update(annotationId: string, data: AnnotationAttributes) {
    const annotation = this.getAnnotationById(annotationId);
    if (!annotation) return;
    const { notebookId } = data;
    // fixme: add the new notebook id to the correct param.
    if (notebookId) annotation.notebook.anchor.href = notebookId;
  }

  remove(annotationId: string) {
    const index = this.annotations.map(({ _meta }) => _meta.id).indexOf(annotationId);
    [this.lastRemoved] = this.annotations.splice(index, 1);

    // emit signal
    this.totalChanged$.next(this.annotations.length);
  }

  getAnnotationById(annotationId: string): AnnotationData | null {
    return this.annotations.find(({ _meta }) => _meta.id === annotationId) || null;
  }

  getAnnotations() {
    return this.annotations.sort((a, b) => {
      const { created: aCreated, startPosition: aStartPosition } = a._meta;
      const { created: bCreated, startPosition: bStartPosition } = b._meta;
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

  private transform(annotation: Annotation) {
    const {
      id,
      notebookId,
      userId,
      subject,
      created
    } = annotation;
    // FIXME: togliere controllo user
    const user = this.userService.getUserById(userId) || {} as any;
    const notebook = this.notebookService.getNotebookById(notebookId);
    const notebooks = this.notebookService.getAll();
    const { text } = subject.selected;
    const startPosition = subject.selected.textPositionSelector.start;
    let comment;
    if (annotation.type === 'Commenting') {
      const { content } = annotation;
      comment = content.comment;
    }

    return {
      _meta: { id, created, startPosition },
      payload: {
        source: 'box',
        id
      },
      user: {
        image: user.thumb,
        name: user.username,
        anchor: {
          payload: {
            source: 'user',
            id: user.id
          }
        }
      },
      isCollapsed: true,
      date: new Date(created).toLocaleDateString(),
      notebook: {
        name: notebook.label,
        anchor: {
          payload: {
            source: 'notebook',
            id: notebook.id
          }
        }
      },
      body: text,
      comment,
      menu: {
        icon: {
          id: 'n7-icon-angle-down',
          payload: {
            id,
            source: 'menu-header',
          }
        },
        actions: [{
          label: 'Change notebook',
          payload: {
            id,
            source: 'action-notebooks'
          }
        }, {
          label: 'Delete',
          payload: {
            id,
            source: 'action-delete'
          }
        }],
        notebooks: {
          header: {
            label: 'Change notebook',
            icon: {
              id: 'n7-icon-caret-down',
            },
            payload: {
              id,
              source: 'notebooks-header'
            }
          },
          items: notebooks
            // .filter(({ id: itemId }) => itemId !== notebook.id)
            .map(({ id: itemId, label }) => ({
              label,
              payload: {
                id,
                notebookId: itemId,
                source: 'notebook-item'
              }
            }))
        }
      },
    };
  }
}
