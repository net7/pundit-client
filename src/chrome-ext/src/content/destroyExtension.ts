import { state } from './state';
import * as handlers from './handlers';
import { EventType } from '../types';

export const destroyExtension = () => {
  if (!state.get('appRoot')) return;

  // remove listeners
  window.removeEventListener(EventType.AnnotationsUpdate, handlers.onAnnotationsUpdate);
  window.removeEventListener(EventType.StorageRequest, handlers.onStorageRequest);

  // emit signal
  const signal = new CustomEvent('punditdestroy');
  window.dispatchEvent(signal);

  // clear
  const badgeInterval = state.get('badgeInterval');
  const appRoot = state.get('appRoot');
  clearInterval(badgeInterval);
  appRoot.remove();
  // update state
  state.set({ badgeIntervalCount: 0, appRoot: null });
};
