import {
  annotation,
  AnnotationAttributes,
  SearchAnnotationParams,
  SearchAnnotationParamsBuilder
} from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';
import { environment as env } from '../../environments/environment';

export class AnnotationModel {
  static baseUrl = env.baseURL;

  @CrossMessage(CrossMsgRequestId.AnnotationCreate)
  static create(requestPayload: AnnotationAttributes) {
    const baseURL = AnnotationModel.baseUrl;
    return annotation.create({ baseURL, data: requestPayload });
  }

  @CrossMessage(CrossMsgRequestId.AnnotationGet)
  static get(id: string) {
    const baseURL = AnnotationModel.baseUrl;
    return annotation.get(id, { baseURL });
  }

  @CrossMessage(CrossMsgRequestId.AnnotationRemove)
  static remove(id: string) {
    const baseURL = AnnotationModel.baseUrl;
    return annotation.remove(id, { baseURL });
  }

  @CrossMessage(CrossMsgRequestId.AnnotationSearch)
  static search(uri: string) {
    const baseURL = AnnotationModel.baseUrl;
    const payload = AnnotationModel.searchAnnotationPayload(uri);
    return annotation.search({ baseURL, data: payload });
  }

  @CrossMessage(CrossMsgRequestId.AnnotationUpdate)
  static update(id: string, data: AnnotationAttributes) {
    const baseURL = AnnotationModel.baseUrl;
    return annotation.update(id, { baseURL, data });
  }

  static searchAnnotationPayload = (uri: string): SearchAnnotationParams => {
    const searchRequestBuilder = new SearchAnnotationParamsBuilder();
    searchRequestBuilder.size(200)
      .uri(uri);
    const params = searchRequestBuilder.build();
    return params;
  };
}
