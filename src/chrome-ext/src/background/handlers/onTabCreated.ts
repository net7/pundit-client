import * as helpers from '../helpers';

export const onTabCreated = ({ id }: chrome.tabs.Tab) => {
  helpers.checkActiveState(id);
};
