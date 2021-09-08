import { social, SocialAttributes } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class SocialModel {
  @CrossMessage(CrossMsgRequestId.SocialCreate)
  static create({ data }: { data: SocialAttributes }) {
    return social.create(data);
  }

  @CrossMessage(CrossMsgRequestId.SocialRemove)
  static remove({ data }: { data: SocialAttributes }) {
    return social.remove(data);
  }
}
