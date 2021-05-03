import * as helpers from '../helpers';

export const onTabActivated = ({ tabId }: chrome.tabs.TabActiveInfo) => {
  helpers.checkActiveState(tabId);
};
