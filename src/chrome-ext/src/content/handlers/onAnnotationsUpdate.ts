import { EventType } from '../../types';
import { state } from '../state';

export const onAnnotationsUpdate = (ev: CustomEvent) => {
  const { total } = ev.detail;
  chrome.runtime.sendMessage({
    type: EventType.AnnotationsUpdate,
    payload: total
  });

  // clear loader
  clearInterval(state.get('badgeInterval'));
};
