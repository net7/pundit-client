import { annotation, AnnotationAttributes } from '@pundit/communication';
import { _c } from '../config';

/**
 * Update an annotation on the backend
 * @param id id of the annotation
 * @param data object to assing to the annotation
 */
export function update(id: string, data: AnnotationAttributes) {
  const baseURL = _c('baseurl');
  annotation.update(id, { baseURL, data });
}
