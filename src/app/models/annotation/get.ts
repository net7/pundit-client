import { annotation } from '@pundit/communication';
import { _c } from '../config';

/**
 * Request for a single annotation based on it's uID
 * @param id annotation uid
 */
export function get(id: string) {
  const baseURL = _c('baseURL');
  return annotation.get(id, { baseURL });
}
