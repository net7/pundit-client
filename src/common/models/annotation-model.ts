import {
  annotation,
  AnnotationAttributes,
  SearchAnnotationParams,
  SearchAnnotationParamsBuilder
} from 'src/communication';
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
  static search(
    uri: string,
    pageMetadata: {
      key: string;
      value: string;
    }[]
  ) {
    const payload = AnnotationModel.searchAnnotationPayload(uri, pageMetadata);
    return annotation.search(payload);
  }

  /**
   * Searches a page's annotations as an anonymous guest (no cookies, no CSRF
   * token): what anyone can read, whatever the user's session.
   * Used by the extension's badge, in the service worker.
   */
  static publicSearch(
    uri: string,
    pageMetadata: {
      key: string;
      value: string;
    }[]
  ) {
    const payload = AnnotationModel.searchAnnotationPayload(uri, pageMetadata);
    return annotation.publicSearch(payload);
  }

  @CrossMessage(CrossMsgRequestId.AnnotationUpdate)
  static update(id: string, data: AnnotationAttributes) {
    return annotation.update(id, data);
  }

  static searchAnnotationPayload = (
    uri: string,
    pageMetadata: {
      key: string;
      value: string;
    }[]
  ): SearchAnnotationParams => {
    const searchRequestBuilder = new SearchAnnotationParamsBuilder();
    searchRequestBuilder
      .page(1)
      .size(200)
      .uri(uri);
    if (pageMetadata) {
      searchRequestBuilder.pageMetadata(pageMetadata);
    }
    const params = searchRequestBuilder.build();
    return params;
  };
}
