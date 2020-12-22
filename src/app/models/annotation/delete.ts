import { annotation } from '@pundit/communication';
import { _c } from '../config';

const baseUrl = _c('baseUrl');

export function remove(annotationId: string) {
  return annotation.remove(annotationId, { baseUrl });
}
