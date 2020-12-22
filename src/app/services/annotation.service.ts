import { Injectable } from '@angular/core';
import { AnnotationData } from '@n7-frontend/components';
import { Annotation } from '@pundit/communication';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';

@Injectable()
export class AnnotationService {
  private annotations: AnnotationData[] = [];

  constructor(
    private userService: UserService,
    private notebookService: NotebookService
  ) {}

  load(rawAnnotations: Annotation[]) {
    // FIXME: controllare con @marco
    this.annotations = rawAnnotations.map(({
      id,
      notebookId,
      userId,
      subject,
      content,
      created
    }) => {
      // FIXME: togliere controllo user
      const user = this.userService.getUserById(userId) || {} as any;
      const notebook = this.notebookService.getNotebookById(notebookId);
      const { text } = subject.selected;
      const { comment } = content || {};

      return {
        _meta: id,
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
        isCollapsed: false,
        date: created,
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
        icon: {
          id: 'n7-icon-cross',
          payload: {
            source: 'icon',
            id
          }
        },
      };
    });
  }

  getAnnotationById(annotationId: string): AnnotationData | null {
    return this.annotations.find(({ _meta }) => _meta === annotationId) || null;
  }

  getAnnotations = () => this.annotations;
}
