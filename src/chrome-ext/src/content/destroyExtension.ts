import { state } from './state';
import { CommonEventType } from '../../../common/types';
import { listenersMap } from './loadExtension';

export const destroyExtension = () => {
  if (!state.get('appRoot')) return;

  // remove listeners
  Object.keys(listenersMap).forEach((type) => {
    const handler = listenersMap[type];
    window.removeEventListener(type, handler);
  });

  // emit signal
  const signal = new CustomEvent(CommonEventType.PunditDestroy);
  window.dispatchEvent(signal);

  // clear
  const badgeInterval = state.get('badgeInterval');
  const appRoot = state.get('appRoot');
  clearInterval(badgeInterval);
  appRoot.remove();
  // update state
  state.set({ badgeIntervalCount: 0, appRoot: null });
};
