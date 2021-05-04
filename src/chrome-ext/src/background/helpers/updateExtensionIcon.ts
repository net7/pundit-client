import { updateBadgeText } from './updateBadgeText';
import { updateBadgeTitle } from './updateBadgeTitle';

const ICON_ON = 'assets/icons/pundit-icon-red-38.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';
const BADGE_COLOR_ON: chrome.browserAction.ColorArray = [13, 133, 236, 255];
const BADGE_COLOR_OFF: chrome.browserAction.ColorArray = [128, 128, 128, 255];

export const updateExtensionIcon = (tabId: number, active: boolean) => {
  chrome.browserAction.setIcon({
    tabId,
    path: active ? ICON_ON : ICON_OFF
  });
  chrome.browserAction.setBadgeBackgroundColor({
    tabId,
    color: active ? BADGE_COLOR_ON : BADGE_COLOR_OFF
  });

  if (!active) {
    updateBadgeText(tabId, 0);
    updateBadgeTitle(tabId, 0, false);
  }
};
