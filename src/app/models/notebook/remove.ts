import { notebook } from '@pundit/communication';
import { _c } from '../config';

/**
 * Create a new notebook on the backend.
 * @param param0 notebook data object
 */
export function remove(id: string) {
  const baseURL = _c('baseURL');
  return notebook.remove(id, { baseURL });
}
