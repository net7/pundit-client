/* eslint-disable */
let appRoot;
chrome.runtime.onMessage.addListener(({ type, payload }, _sender, sendResponse) => {
  switch(type) {
    case 'iconclick': 
    case 'tabactivated': {
      if (payload) {
        load();
      } else {
        destroy();
      }
      break;
    }
    default:
      break;
  }
});

function load() {
  if (appRoot) return;

  appRoot = document.createElement("pnd-root");
  document.body.appendChild(appRoot);
  
  const main = document.createElement('script');
  main.src = chrome.extension.getURL('pundit.chrome-ext.js');
  (document.head||document.documentElement).appendChild(main);
  main.onload = function() {
    // emit signal
    const signal = new CustomEvent("punditloaded", { detail: { id: chrome.runtime.id } });
    window.dispatchEvent(signal);
    main.remove();
  };
}

function destroy() {
  if (!appRoot) return;

  // emit signal
  const signal = new CustomEvent("punditdestroy");
  window.dispatchEvent(signal);
  // clear
  appRoot.remove();
  appRoot = null;
}