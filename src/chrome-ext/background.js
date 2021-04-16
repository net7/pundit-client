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
  Incognito: 'incognito'
}
const UserStorageKeys = {
  User: 'pundit-user',
  Token: 'pundit-token',
  Notebook: 'pundit-notebook',
};

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
  Storage.remove(activeKey);
});

chrome.windows.onRemoved.addListener((windowId) => {
  const incognitoKey = `${StorageKeys.Incognito}.${windowId}`;
  Storage.get(incognitoKey)
    .then((value) => {
      if (value) {
        // remove incognito key
        Storage.remove(incognitoKey);
        // remove user storage keys
        Object.keys(UserStorageKeys).forEach((key) => {
          Storage.remove(`${UserStorageKeys[key]}.${windowId}`);
        });
      }
    });
})

chrome.windows.onCreated.addListener((currentWindow) => {
  if (currentWindow.incognito) {
    Storage.set(`${StorageKeys.Incognito}.${currentWindow.id}`, true);
  }
})

// content listener
chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  const { tab } = _sender;
  const { incognito, windowId } = tab;
  switch(type) {
    case 'annotationsupdate': 
      updateBadgeText(tab.id, payload);
      updateBadgeTitle(tab.id, payload);
      break;
    case 'notebooksupdate':
      // storage sync
      setUserStorage({
        incognito, 
        windowId,
        key: UserStorageKeys.Notebook,
        value: payload 
      });
      break;
    case 'userlogged':
      const { isLogged, user, token } = payload;
      // storage sync
      if (isLogged) {
        setUserStorage({
          incognito, 
          windowId,
          key: UserStorageKeys.User,
          value: user 
        });
        setUserStorage({
          incognito, 
          windowId,
          key: UserStorageKeys.Token,
          value: token 
        });
      } else {
        removeUserStorage({ incognito, windowId, key: UserStorageKeys.User });
        removeUserStorage({ incognito, windowId, key: UserStorageKeys.Token });
        removeUserStorage({ incognito, windowId, key: UserStorageKeys.Notebook });
      }
      break;
    case 'rootelementexists':
      onBrowserActionClicked(tab.id);
      break;
    case 'notebookid.request':
      Storage.get(UserStorageKeys.Notebook).then((notebookId) => {
        const payload = { notebookId };
        chrome.tabs.sendMessage(tab.id, { type: 'notebookid.response', payload });
      });
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
      chrome.windows.get(windowId, ({ type, incognito }) => {
        // popup check
        if (type === 'popup') {
          return;
        }
        const storageKeysMap = {
          active: `${StorageKeys.Active}.${tabId}`,
          user: UserStorageKeys.User, 
          token: UserStorageKeys.Token, 
          notebookId: UserStorageKeys.Notebook
        };
        if (incognito) {
          ['user', 'token', 'notebookId'].forEach((key) => {
            storageKeysMap[key] = `${storageKeysMap[key]}.${windowId}`;
          });
        }
        Storage.getMulti(Object.values(storageKeysMap))
          .then((values) => {
            const payload = {
              active: values[storageKeysMap.active], 
              user: values[storageKeysMap.user], 
              token: values[storageKeysMap.token], 
              notebookId: values[storageKeysMap.notebookId]
            };
            chrome.tabs.sendMessage(tabId, { type: 'statechanged', payload });
            updateExtensionIcon(tabId, payload.active);
          })
      })
    }
  })
}

function onBrowserActionClicked(tabId) {
  const activeKey = `${StorageKeys.Active}.${tabId}`;
  Storage.get(activeKey)
    .then((value) => {
      if (value) {
        return Storage.remove(activeKey);
      }
      return Storage.set(activeKey, !value);
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

function setUserStorage({ key, value, incognito, windowId }) {
  Storage.set(incognito ? `${key}.${windowId}` : key, value);
} 

function removeUserStorage({ key, incognito, windowId }) {
  Storage.remove(incognito ? `${key}.${windowId}` : key);
} 