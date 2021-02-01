/* eslint-disable */
let appRoot;
let badgeInterval;
let badgeIntervalCount = 0;

chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  switch(type) {
    case 'statechanged': {
      const { isActive, user, token } = payload;
      if (isActive) {
        load(user, token);
      } else {
        destroy();
      }
      break;
    }
    default:
      break;
  }
});

function load(user, token) {
  if (appRoot) return;

  appRoot = document.createElement("pnd-root");
  document.body.appendChild(appRoot);
  
  const main = document.createElement('script');
  main.src = chrome.extension.getURL('pundit.chrome-ext.js');
  (document.head||document.documentElement).appendChild(main);
  main.onload = function() {
    // emit signal
    const signal = new CustomEvent("punditloaded", { 
      detail: { 
        user,
        token,
        id: chrome.runtime.id 
      }
    });
    window.dispatchEvent(signal);

    // loader interval
    badgeInterval = setInterval(badgeLoader, 500);
    // init loader
    badgeLoader();

    // listen to annotation updates
    window.addEventListener('annotationsupdate', onAnnotationUpdate, false);
    // listen login events
    window.addEventListener('userlogged', onUserLogged, false);
    main.remove();
  };
}

function destroy() {
  if (!appRoot) return;
  
  // remove annotation listener
  window.removeEventListener('annotationsupdate', onAnnotationUpdate);

  // emit signal
  const signal = new CustomEvent("punditdestroy");
  window.dispatchEvent(signal);
  // clear
  clearInterval(badgeInterval);
  badgeIntervalCount = 0;
  appRoot.remove();
  appRoot = null;
}

function badgeLoader() {
  badgeIntervalCount++;
  chrome.runtime.sendMessage({
    type: 'annotationsupdate',
    payload: new Array(badgeIntervalCount).fill('·').join('')
  });

  // reset
  if (badgeIntervalCount === 3) {
    badgeIntervalCount = 0;
  }
}

function onAnnotationUpdate(ev) {
  const { total } = ev.detail;
  chrome.runtime.sendMessage({
    type: 'annotationsupdate',
    payload: total
  });

  // clear loader
  clearInterval(badgeInterval);
}

function onUserLogged(ev) {
  chrome.runtime.sendMessage({
    type: 'userlogged',
    payload: ev.detail
  });
}