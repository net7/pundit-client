import { notebook, NotebookAttributes, PutRequestOptions } from '@pundit/communication';
import { _c } from '../config';

export function update(id: string, { data }: PutRequestOptions<NotebookAttributes>) {
  const baseURL = _c('baseURL');
  return notebook.update(id, { baseURL, data });
}
