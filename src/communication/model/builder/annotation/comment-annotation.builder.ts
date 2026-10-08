import { CommentAnnotation, WebPage } from '../../entity';
import { AbstractAnnotationBuilder } from './abstract-annotation.builder';

export class CommentAnnotationBuilder extends AbstractAnnotationBuilder {
    private _content!: { comment: string };

    notebookId(id: string): CommentAnnotationBuilder {
      super.notebookId(id);
      return this;
    }

    userId(id: string): CommentAnnotationBuilder {
      super.userId(id);
      return this;
    }

    serializedBy(id: string): CommentAnnotationBuilder {
      super.serializedBy(id);
      return this;
    }

    subject(page: WebPage): CommentAnnotationBuilder {
      super.subject(page);
      return this;
    }

    comment(comment: string): CommentAnnotationBuilder {
      this._content = { comment };
      return this;
    }

    public build = (): CommentAnnotation => {
      const baseAnnotation = super.build();
      return {
        ...baseAnnotation,
        type: 'Commenting',
        content: this._content
      };
    };
}
