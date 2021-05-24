import { Observable } from 'rxjs';
import { StorageKey } from '../../../common/types';

export type StorageValue = string | object | null;
export interface StorageProvider {
  get: (key: StorageKey) => Observable<StorageValue>;
  set: (key: StorageKey, value: StorageValue) => void;
  remove: (key: StorageKey) => void;
}
