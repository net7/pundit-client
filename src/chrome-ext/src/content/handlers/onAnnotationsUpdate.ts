import { CommonEventType } from '../../../../common/types';
import { state } from '../state';

export const onAnnotationsUpdate = (ev: CustomEvent) => {
  const { total } = ev.detail;
  chrome.runtime.sendMessage({
    type: CommonEventType.AnnotationsUpdate,
    payload: total
  });

  // clear loader
  clearInterval(state.get('badgeInterval'));
};
