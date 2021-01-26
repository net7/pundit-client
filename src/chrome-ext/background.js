/* eslint-disable */
const ACTIVE_KEY = 'active';
const ICON_ON = 'assets/icons/pundit-icon-red-38.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';

class Storage {
  static get(key) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (result) => {
        res(!!result[key]);
      })
    });
  }

  static set(key, value) {
    return new Promise((res) => {
      chrome.storage.local.set({ [key]: value }, () => {
        res(value);
      })
    })
  }

  static remove(key) {
    return new Promise((res) => {
      chrome.storage.local.remove(key, () => {
        res(key);
      })
    })
  }
}

function updateExtensionIcon(active) {
  chrome.browserAction.setIcon({
    path: active ? ICON_ON : ICON_OFF
  });
}

chrome.browserAction.onClicked.addListener((tab) => {
  const key = `${ACTIVE_KEY}.${tab.id}`;
  Storage.get(key)
    .then((value) => {
      return Storage.set(key, !value)
    })
    .then((newValue) => {
      // change icon
      chrome.tabs.sendMessage(tab.id, { type: 'iconclick', payload: newValue });
      updateExtensionIcon(newValue);
    })
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  const key = `${ACTIVE_KEY}.${tabId}`;
  Storage.get(key)
    .then((value) => {
      chrome.tabs.sendMessage(tabId, { type: 'tabactivated', payload: value });
      updateExtensionIcon(value);
    })
});

chrome.tabs.onUpdated.addListener((tabId) => {
  const key = `${ACTIVE_KEY}.${tabId}`;
  Storage.get(key)
    .then((value) => {
      chrome.tabs.sendMessage(tabId, { type: 'tabactivated', payload: value });
      updateExtensionIcon(value);
    })
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `${ACTIVE_KEY}.${tabId}`;
  Storage.remove(key)
});
