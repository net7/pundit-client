import { ReplyAttributes } from '../../entity';

export class ReplyBuilder {
    private _parentId!: string;

    private _annotationId!: string;

    private _userId!: string;

    private _comment!: string;

    public setUserId = (userId: string): ReplyBuilder => {
      this._userId = userId;
      return this;
    }

    public setAnnotationId = (annotationId: string): ReplyBuilder => {
      this._annotationId = annotationId;
      return this;
    }

    public setParentId = (parentId: string): ReplyBuilder => {
      this._parentId = parentId;
      return this;
    }

    public setComment = (comment: string): ReplyBuilder => {
      this._comment = comment;
      return this;
    }

    public build = (): ReplyAttributes => ({
      userId: this._userId,
      annotationId: this._annotationId,
      parentId: this._parentId,
      comment: this._comment,
      type: 'Comment'
    });
}
