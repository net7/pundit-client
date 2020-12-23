import { notebook } from '@pundit/communication';
import { _c } from '../config';

export function search() {
  const baseURL = _c('baseURL');
  return notebook.search({ baseURL, data: {} });
}
