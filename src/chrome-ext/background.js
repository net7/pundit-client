/* eslint-disable */
chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'iconclick' });
});
