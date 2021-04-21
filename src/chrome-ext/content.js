/* eslint-disable */
let appRoot;
let badgeInterval;
let badgeIntervalCount = 0;
let rootExistMessageSended = false;

chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  switch(type) {
    case 'statechanged': {
      const { active, user, token, notebookId } = payload;
      if (active) {
        load(user, token, notebookId);
      } else {
        destroy();
      }
      break;
    }
    case 'notebookid.response': {
      const signal = new CustomEvent('notebookid.response', { 
        detail: payload
      });
      window.dispatchEvent(signal);
      break;
    }
    case 'storage.response': {
      const signal = new CustomEvent('storage.response', { 
        detail: payload
      });
      window.dispatchEvent(signal);
      break;
    }
    default:
      break;
  }
});

function load(user, token, notebookId) {
  if (appRoot) return;

  // existing embed pundit check
  if (document.querySelector('pnd-root')) {
    sendRootExistsMessage();
    return;
  }

  appRoot = document.createElement('pnd-root');
  document.body.appendChild(appRoot);
  
  const main = document.createElement('script');
  main.src = chrome.extension.getURL('pundit.chrome-ext.js');
  (document.head||document.documentElement).appendChild(main);
  main.onload = function() {
    // emit signal
    const signal = new CustomEvent('punditloaded', { 
      detail: { 
        user,
        token,
        notebookId,
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
    // listen to notebook updates
    window.addEventListener('notebooksupdate', onNotebookUpdate, false);
    // listen login events
    window.addEventListener('userlogged', onUserLogged, false);
    // listen notebookid request event
    window.addEventListener('notebookid.request', onNotebookIdRequest, false);
    // listen storage request event
    window.addEventListener('storage.request', onStorageRequest, false);
    main.remove();
  };
}

function destroy() {
  if (!appRoot) return;
  
  // remove listeners
  window.removeEventListener('annotationsupdate', onAnnotationUpdate);
  window.removeEventListener('notebooksupdate', onNotebookUpdate);
  window.removeEventListener('userlogged', onUserLogged);
  window.removeEventListener('notebookid.request', onNotebookIdRequest);
  window.removeEventListener('storage.request', onStorageRequest);

  // emit signal
  const signal = new CustomEvent('punditdestroy');
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

function sendRootExistsMessage() {
  chrome.runtime.sendMessage({ type: 'rootelementexists' });
  setTimeout(() => {
    if (!rootExistMessageSended) {
      rootExistMessageSended = true;
      window.dispatchEvent(new CustomEvent('rootelementexists'));
    }
  }, 3000);
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

function onNotebookUpdate(ev) {
  const { selectedId } = ev.detail;
  chrome.runtime.sendMessage({
    type: 'notebooksupdate',
    payload: selectedId
  });
}

function onUserLogged(ev) {
  chrome.runtime.sendMessage({
    type: 'userlogged',
    payload: ev.detail
  });
}

function onNotebookIdRequest() {
  chrome.runtime.sendMessage({
    type: 'notebookid.request'
  });
}

function onStorageRequest(ev) {
  chrome.runtime.sendMessage({
    type: 'storage.request',
    payload: ev.detail
  });
}