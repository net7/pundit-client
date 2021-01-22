/* eslint-disable */
const ACTIVE_KEY = 'active';
const ICON_ON = 'assets/icons/pundit-icon-red-38.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';

class Storage {
  static get(key) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (result) => {
        console.log('get', key, result[key]);
        res(result[key]);
      })
    });
  }

  static set(key, value) {
    return new Promise((res) => {
      chrome.storage.local.set({ [key]: value }, () => {
        console.log('set', key, value);
        res(value);
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
  Storage.get(ACTIVE_KEY)
    .then((value) => {
      return Storage.set(ACTIVE_KEY, !value)
    })
    .then((newValue) => {
      // change icon
      chrome.tabs.sendMessage(tab.id, { type: 'iconclick', payload: newValue });
    })
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  Storage.get(ACTIVE_KEY)
    .then((value) => {
      chrome.tabs.sendMessage(tabId, { type: 'tabactivated', payload: value });
    })
});

chrome.tabs.onUpdated.addListener((tabId) => {
  Storage.get(ACTIVE_KEY)
    .then((value) => {
      chrome.tabs.sendMessage(tabId, { type: 'tabactivated', payload: value });
    })
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes[ACTIVE_KEY]) {
    const { newValue } = changes[ACTIVE_KEY];
    updateExtensionIcon(newValue);
  }
});

// init
Storage.get(ACTIVE_KEY)
  .then((value) => {
    updateExtensionIcon(value);
  })