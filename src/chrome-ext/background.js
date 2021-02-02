/* eslint-disable */
const ACTIVE_KEY = 'active';
const USER_KEY = 'pundit-user';
const TOKEN_KEY = 'pundit-token';
const ICON_ON = 'assets/icons/pundit-icon-red-38.png';
const ICON_OFF = 'assets/icons/pundit-icon-38.png';
const BADGE_COLOR_ON = [13, 133, 236, 255];
const BADGE_COLOR_OFF = [128, 128, 128, 255];

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
  const key = `${ACTIVE_KEY}.${tab.id}`;
  Storage.get(key)
    .then((value) => {
      return Storage.set(key, !value)
    })
    .then(() => {
      onChange(tab.id);
    })
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  onChange(tabId);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.tabs.get((tabId), (tab) => {
    console.log('tab', tab);
    onChange(tabId);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `${ACTIVE_KEY}.${tabId}`;
  Storage.remove(key)
});

// content listener
chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  switch(type) {
    case 'annotationsupdate':
      const { tab } = _sender; 
      chrome.browserAction.setBadgeText({
        tabId: tab.id,
        text: payload ? '' + payload : null
      });
      break;
    case 'userlogged':
      const { isLogged, user, token } = payload;
      if (isLogged) {
        saveUserInMemory(user, token);
      } else {
        removeUserFromMemory();
      }
      break;
    default:
      break;
  }
});

function onChange(tabId) {
  const key = `${ACTIVE_KEY}.${tabId}`;
  Storage.getMulti([key, USER_KEY, TOKEN_KEY])
    .then((values) => {
      const isActive = values[key];
      const user = values[USER_KEY];
      const token = values[TOKEN_KEY];
      chrome.tabs.sendMessage(tabId, { type: 'statechanged', payload: {
        isActive, user, token
      }});
      updateExtensionIcon(isActive);
    })
}

function saveUserInMemory(user, token) {
  Storage.set(USER_KEY, user);
  Storage.set(TOKEN_KEY, token);
}

function removeUserFromMemory() {
  Storage.remove(USER_KEY);
  Storage.remove(TOKEN_KEY);
}
