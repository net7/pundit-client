/* eslint-disable */
const ICON_ON = 'assets/icons/pundit-icon-red-38.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';
const BADGE_COLOR_ON = [13, 133, 236, 255];
const BADGE_COLOR_OFF = [128, 128, 128, 255];
const StorageKeys = {
  Active: 'active',
  User: 'pundit-user',
  Token: 'pundit-token',
  Notebook: 'pundit-notebook'
}

class Storage {
  static get(key) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (result) => {
        res(result[key]);
      })
    });
  }

  static getMulti(keys) {
    return new Promise((res) => {
      chrome.storage.local.get(keys, (result) => {
        res(result);
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
  chrome.browserAction.setBadgeBackgroundColor({
    color: active ? BADGE_COLOR_ON : BADGE_COLOR_OFF
  });
}

chrome.browserAction.onClicked.addListener((tab) => {
  onBrowserActionClicked(tab.id);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  onChange(tabId);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.tabs.get((tabId), () => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      onChange(tabId);
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  Storage.remove(activeKey)
});

// content listener
chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  const { tab } = _sender;
  switch(type) {
    case 'annotationsupdate': 
      chrome.browserAction.setBadgeText({
        tabId: tab.id,
        text: payload ? '' + payload : null
      });
      break;
    case 'notebooksupdate':
      // storage sync
      Storage.set(StorageKeys.Notebook, payload);
      break;
    case 'userlogged':
      const { isLogged, user, token } = payload;
      // storage sync
      if (isLogged) {
        Storage.set(StorageKeys.User, user);
        Storage.set(StorageKeys.Token, token);
      } else {
        Storage.remove(StorageKeys.User);
        Storage.remove(StorageKeys.Token);
        Storage.remove(StorageKeys.Notebook);
      }
      break;
    case 'rootelementexists':
      onBrowserActionClicked(tab.id);
      break;
    default:
      break;
  }
});

function onChange(tabId) {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  Storage.getMulti([
      activeKey, 
      StorageKeys.User, 
      StorageKeys.Token, 
      StorageKeys.Notebook
    ])
    .then((values) => {
      const isActive = values[activeKey];
      const user = values[StorageKeys.User];
      const token = values[StorageKeys.Token];
      const notebookId = values[StorageKeys.Notebook];

      chrome.tabs.sendMessage(tabId, { type: 'statechanged', payload: {
        isActive, user, token, notebookId
      }});
      updateExtensionIcon(isActive);
    })
}

function onBrowserActionClicked(tabId) {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  Storage.get(activeKey)
    .then((value) => {
      return Storage.set(activeKey, !value)
    })
    .then(() => {
      onChange(tabId);
    })
}
