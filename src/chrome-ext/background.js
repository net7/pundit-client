/* eslint-disable */
const IconTitle = {
  ActiveWithAnnotations: 'Pundit is active ($n annotations on this page)',
  ActiveWithOneAnnotation: 'Pundit is active (1 annotation on this page)',
  ActiveWithNoAnnotations: 'Pundit is active',
  Inactive: 'Pundit is inactive',
};
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

function updateExtensionIcon(tabId, active) {
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
}

chrome.browserAction.onClicked.addListener((tab) => {
  onBrowserActionClicked(tab.id);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  onChange(tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  onChange(tab.id);
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
      updateBadgeText(tab.id, payload);
      updateBadgeTitle(tab.id, payload);
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
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      const { windowId } = tab;
      chrome.windows.get(windowId, ({ type }) => {
        // popup check
        if (type === 'popup') {
          return;
        }
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
            updateExtensionIcon(tabId, isActive);
          })
      })
    }
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

function updateBadgeText(tabId, number) {
  chrome.browserAction.setBadgeText({
    tabId,
    text: number ? '' + number : null
  });
}

function updateBadgeTitle(tabId, number, active = true) {
  let title = IconTitle.Inactive;
  if (active) {
    switch(number) {
      case 0:
        title = IconTitle.ActiveWithNoAnnotations;
        break;
      case 1:
        title = IconTitle.ActiveWithOneAnnotation;
        break;
      default:
        title = IconTitle.ActiveWithAnnotations.replace('$n', number);
        break;
    }
  }
  chrome.browserAction.setTitle({ tabId, title })
}
