import { EventType } from 'src/chrome-ext/types';
import { state } from '../state';

export const onAnnotationUpdate = (ev: CustomEvent) => {
  const { total } = ev.detail;
  chrome.runtime.sendMessage({
    type: EventType.AnnotationsUpdate,
    payload: total
  });

  // clear loader
  clearInterval(state.get('badgeInterval'));
};
