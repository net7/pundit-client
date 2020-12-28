/* eslint-disable */
let appRoot;
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'iconclick') {
    if(!appRoot) {
      load()
    } else {
      appRoot.remove();
    }
  }
});


function load() {
  appRoot = document.createElement("pnd-root");
  document.body.appendChild(appRoot);
  
  const main = document.createElement('script');
  main.src = chrome.extension.getURL('main.js');
  (document.head||document.documentElement).appendChild(main);
  main.onload = function() {
    // emit signal
    const signal = new CustomEvent("punditloaded", { detail: { id: chrome.runtime.id } });
    window.dispatchEvent(signal);
    main.remove();
  };
  
  const styles = document.createElement('script');
  styles.src = chrome.extension.getURL('styles.js');
  (document.head||document.documentElement).appendChild(styles);
  styles.onload = function() {
      styles.remove();
  };
}