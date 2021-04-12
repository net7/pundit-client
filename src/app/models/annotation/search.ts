import { annotation, SearchAnnotationParams, SearchAnnotationParamsBuilder } from '@pundit/communication';
import { _c } from '../config';

const searchAnnotationPayload = (uri: string): SearchAnnotationParams => {
  const searchRequestBuilder = new SearchAnnotationParamsBuilder();
  searchRequestBuilder.size(200)
    .uri(uri);
  const params = searchRequestBuilder.build();
  return params;
};
export async function search(uri: string) {
  const baseURL = _c('baseURL');
  const payload = searchAnnotationPayload(uri);
  return annotation.search({ baseURL, data: payload });
}
