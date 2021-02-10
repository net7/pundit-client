import { notebook, NotebookAttributes } from '@pundit/communication';
import { _c } from '../config';

/**
 * Create a new notebook on the backend.
 * @param param0 notebook data object
 */
export function create({ data }: { data: NotebookAttributes }) {
  const baseURL = _c('baseURL');
  return notebook.create({ baseURL, data });
}
