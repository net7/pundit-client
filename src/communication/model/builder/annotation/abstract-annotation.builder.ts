import { AnnotationBase, Tag, WebPage } from '../../entity';

export abstract class AbstractAnnotationBuilder {
    protected _notebookId!: string;

    protected _userId!: string;

    protected _serializedBy!: string;

    protected _subject!: WebPage;

    protected _color!: string;

    protected _tags!: Tag[];

    notebookId(id: string): AbstractAnnotationBuilder {
      this._notebookId = id;
      return this;
    }

    userId(id: string): AbstractAnnotationBuilder {
      this._userId = id;
      return this;
    }

    serializedBy(id: string): AbstractAnnotationBuilder {
      this._serializedBy = id;
      return this;
    }

    subject(page: WebPage): AbstractAnnotationBuilder {
      this._subject = page;
      return this;
    }

    color(color: string): AbstractAnnotationBuilder {
      this._color = color;
      return this;
    }

    tags(tags: Tag[]): AbstractAnnotationBuilder {
      this._tags = tags;
      return this;
    }

    public build(): AnnotationBase {
      return {
        notebookId: this._notebookId,
        userId: this._userId,
        serializedBy: this._serializedBy,
        subject: this._subject,
        tags: this._tags,
        color: this._color
      };
    }
}
