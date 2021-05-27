import {
  annotation,
  AnnotationAttributes,
  SearchAnnotationParams,
  SearchAnnotationParamsBuilder
} from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class AnnotationModel {
  @CrossMessage(CrossMsgRequestId.AnnotationCreate)
  static create(requestPayload: AnnotationAttributes) {
    return annotation.create(requestPayload);
  }

  @CrossMessage(CrossMsgRequestId.AnnotationGet)
  static get(id: string) {
    return annotation.get(id);
  }

  @CrossMessage(CrossMsgRequestId.AnnotationRemove)
  static remove(id: string) {
    return annotation.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.AnnotationSearch)
  static search(uri: string, publicSearch?: boolean) {
    const payload = AnnotationModel.searchAnnotationPayload(uri);
    if (publicSearch) {
      return annotation.publicSearch(payload);
    }
    return annotation.search(payload);
  }

  @CrossMessage(CrossMsgRequestId.AnnotationUpdate)
  static update(id: string, data: AnnotationAttributes) {
    return annotation.update(id, data);
  }

  static searchAnnotationPayload = (uri: string): SearchAnnotationParams => {
    const searchRequestBuilder = new SearchAnnotationParamsBuilder();
    searchRequestBuilder.size(200)
      .uri(uri);
    const params = searchRequestBuilder.build();
    return params;
  };
}
