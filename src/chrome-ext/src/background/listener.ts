import * as handlers from './handlers';

export const listen = () => {
  // browser action click
  chrome.action.onClicked.addListener(handlers.onBrowserActionClicked);
  // tab activated
  chrome.tabs.onActivated.addListener(handlers.onTabActivated);
  // tab created
  chrome.tabs.onCreated.addListener(handlers.onTabCreated);
  // tab updated
  chrome.tabs.onUpdated.addListener(handlers.onTabUpdated);
  // tab removed
  chrome.tabs.onRemoved.addListener(handlers.onTabRemoved);
  // window removed
  chrome.windows.onRemoved.addListener(handlers.onWindowRemoved);
  // window created
  chrome.windows.onCreated.addListener(handlers.onWindowCreated);
  // content script messages listener
  chrome.runtime.onMessage.addListener(handlers.onContentScriptMessage);
};
