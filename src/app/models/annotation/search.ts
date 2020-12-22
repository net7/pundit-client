import { annotation, SearchAnnotationParams, SearchAnnotationParamsBuilder } from '@pundit/communication';
import { _c } from '../config';

const baseUrl = _c('baseUrl');

const searchAnnotationPayload = (uri: string): SearchAnnotationParams => {
  const searchRequestBuilder = new SearchAnnotationParamsBuilder();
  searchRequestBuilder.size(200)
    .uri(uri);
  const params = searchRequestBuilder.build();
  return params;
};
export function search(uri: string) {
  const payload = searchAnnotationPayload(uri);
  return annotation.search({ baseUrl, data: payload });
}
