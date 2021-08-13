import { AnnotationCommentAttributes, comment } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class CommentModel {
  @CrossMessage(CrossMsgRequestId.CommentCreate)
  static create({ data }: { data: AnnotationCommentAttributes }) {
    return comment.create(data);
  }

  @CrossMessage(CrossMsgRequestId.CommentRemove)
  static remove(id: string) {
    return comment.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.CommentUpdate)
  static update(id: string, { data }: { data: AnnotationCommentAttributes }) {
    return comment.update(id, data);
  }
}
