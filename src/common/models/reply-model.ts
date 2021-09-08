import { ReplyAttributes, comment } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class ReplyModel {
  @CrossMessage(CrossMsgRequestId.ReplyCreate)
  static create({ data }: { data: ReplyAttributes }) {
    return comment.create(data);
  }

  @CrossMessage(CrossMsgRequestId.ReplyRemove)
  static remove(id: string) {
    return comment.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.ReplyUpdate)
  static update(id: string, { data }: { data: ReplyAttributes }) {
    return comment.update(id, data);
  }
}
