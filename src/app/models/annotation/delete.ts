import { annotation } from '@pundit/communication';

export function remove(annotationId: string) {
  return annotation.remove(annotationId, { baseUrl: '' });
}
