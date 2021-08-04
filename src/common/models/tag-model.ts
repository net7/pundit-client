import { tag } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class TagModel {
  @CrossMessage(CrossMsgRequestId.TagGet)
  static get() {
    return tag.get();
  }
}
