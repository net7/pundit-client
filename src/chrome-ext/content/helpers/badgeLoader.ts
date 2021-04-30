import { state } from '../state';

export const badgeLoader = () => {
  const badgeIntervalCount = state.get('badgeIntervalCount');
  let newCountValue = badgeIntervalCount + 1;
  chrome.runtime.sendMessage({
    type: 'annotationsupdate',
    payload: new Array(newCountValue).fill('·').join('')
  });

  // reset
  if (newCountValue === 3) {
    newCountValue = 0;
  }
  state.set({ badgeIntervalCount: newCountValue });
};
