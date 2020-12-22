import { annotation, SearchAnnotationParams, SearchAnnotationParamsBuilder } from '@pundit/communication';

const searchAnnotationPayload = (uri: string): SearchAnnotationParams => {
  const searchRequestBuilder = new SearchAnnotationParamsBuilder();
  searchRequestBuilder.size(100)
    .uri(uri);
  const params = searchRequestBuilder.build();
  return params;
};

/**
 * Creates a new annotation that is associated with the selected region of
 * the current document.
 */
export function search(uri: string) {
  const payload = searchAnnotationPayload(uri);
  return annotation.search({ baseUrl: '', data: payload, method: 'post' });
}
