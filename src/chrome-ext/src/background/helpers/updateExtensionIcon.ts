import { updateBadgeText } from './updateBadgeText';
import { updateBadgeTitle } from './updateBadgeTitle';

const ICON_ON = 'assets/icons/pundit-icon-38-close.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';
const BADGE_COLOR_ON: chrome.action.ColorArray = [81, 110, 238, 255];
const BADGE_COLOR_OFF: chrome.action.ColorArray = [128, 128, 128, 255];
const TITLE_UNAVAILABLE = 'Pundit is not available on this page';

export const updateExtensionIcon = (tabId: number, active: boolean) => {
  chrome.action.enable(tabId);
  chrome.action.setIcon({
    tabId,
    path: active ? ICON_ON : ICON_OFF
  });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: active ? BADGE_COLOR_ON : BADGE_COLOR_OFF
  });

  if (!active) {
    updateBadgeText(tabId, 0);
    updateBadgeTitle(tabId, 0, false);
  }
};

/**
 * A page where Pundit cannot run: the action is disabled, so the icon is
 * greyed out and a click does nothing.
 */
export const setExtensionUnavailable = (tabId: number) => {
  chrome.action.disable(tabId);
  chrome.action.setIcon({ tabId, path: ICON_OFF });
  updateBadgeText(tabId, 0);
  chrome.action.setTitle({ tabId, title: TITLE_UNAVAILABLE });
};
