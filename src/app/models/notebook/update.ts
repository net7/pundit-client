import { notebook, NotebookAttributes } from '@pundit/communication';
import { _c } from '../config';

export function update(id: string, { data }: { data: NotebookAttributes }) {
  // change the notebook data on the backend
  const baseURL = _c('baseURL');
  return notebook.update(id, { baseURL, data });
}
