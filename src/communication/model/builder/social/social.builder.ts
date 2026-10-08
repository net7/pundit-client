import { SocialType, SocialAttributes } from '../../entity';

export class SocialBuilder {
    private _type!: SocialType;

    private _parentId!: string;

    private _annotationId!: string;

    private _userId!: string;

    public setUserId = (userId: string): SocialBuilder => {
      this._userId = userId;
      return this;
    }

    public setAnnotationId = (annotationId: string): SocialBuilder => {
      this._annotationId = annotationId;
      return this;
    }

    public setParentId = (parentId: string): SocialBuilder => {
      this._parentId = parentId;
      return this;
    }

    public setType = (type: SocialType): SocialBuilder => {
      this._type = type;
      return this;
    }

    public build = (): SocialAttributes => ({
      userId: this._userId,
      annotationId: this._annotationId,
      parentId: this._parentId,
      type: this._type
    });
}
