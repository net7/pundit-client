import { social, SocialAttributes } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class SocialModel {
  @CrossMessage(CrossMsgRequestId.SocialCreate)
  static create({ data }: { data: SocialAttributes }) {
    return social.create(data);
  }

  @CrossMessage(CrossMsgRequestId.SocialRemove)
  static remove(id: string) {
    return social.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.SocialUpdate)
  static update(id: string, { data }: { data: SocialAttributes }) {
    return social.update(id, data);
  }
}
