/* eslint-disable */
const IconTitle = {
  ActiveWithAnnotations: 'Pundit is active ($n annotations on this page)',
  ActiveWithOneAnnotation: 'Pundit is active (1 annotation on this page)',
  ActiveWithNoAnnotations: 'Pundit is active',
  Inactive: 'Pundit is inactive',
};
const ICON_ON = 'assets/icons/pundit-icon-38-close.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';
const BADGE_COLOR_ON = [13, 133, 236, 255];
const BADGE_COLOR_OFF = [128, 128, 128, 255];
const StorageKeys = {
  Active: 'active',
  Incognito: 'incognito'
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
  Storage.remove(activeKey);
});

chrome.windows.onRemoved.addListener((windowId) => {
  const incognitoKey = `${StorageKeys.Incognito}.${windowId}`;
  Storage.get(incognitoKey)
    .then((value) => {
      if (value) {
        // remove incognito key
        Storage.remove(incognitoKey);
        // remove incognito window storage keys
        chrome.storage.local.get(null, (items) => {
          Object.keys(items)
            .filter((key) => key.indexOf(windowId) !== -1)
            .forEach((key) => {
              Storage.remove(key);
            })
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
  switch(type) {
    case 'annotationsupdate': 
      updateBadgeText(tab.id, payload);
      updateBadgeTitle(tab.id, payload);
      break;
    case 'rootelementexists':
      onBrowserActionClicked(tab.id);
      break;
    case 'storage.request':
      doStorageRequest(tab, payload);
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
        Storage.get(activeKey)
          .then((active) => {
            const payload = { active };
            chrome.tabs.sendMessage(tabId, { type: 'statechanged', payload });
            updateExtensionIcon(tabId, active);
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

function doStorageRequest(tab, payload) {
  const { id: tabId, incognito, windowId } = tab;
  const { key, value, operation } = payload;
  const storageKey = incognito ? `${key}.${windowId}` : key;
  let task$;
  switch(operation) {
    case 'get':
      task$ = Storage.get(storageKey);
      break;
    case 'set':
      task$ = Storage.set(storageKey, value);
      break;
    case 'remove':
      task$ = Storage.remove(storageKey);
      break;
    default:
      break;
  }

  task$.then((value) => {
    const payload = {
      status: 'OK'
    };
    if (operation === 'get'){
      payload.data = value;
    }
    chrome.tabs.sendMessage(tabId, { type: 'storage.response', payload });
  }).catch((_e) => {
    const payload = {
      status: 'KO'
    };
    chrome.tabs.sendMessage(tabId, { type: 'storage.response', payload });
  })

}