import { ai, AiAnnotateRequest } from 'src/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class AiModel {
  @CrossMessage(CrossMsgRequestId.AiAnnotate)
  static annotate(data: AiAnnotateRequest) {
    return ai.annotate(data);
  }
}
