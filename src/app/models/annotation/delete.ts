import { annotation } from '@pundit/communication';
import { _c } from '../config';

export function remove(annotationId: string) {
  const baseURL = _c('baseURL');
  return annotation.remove(annotationId, { baseURL });
}
