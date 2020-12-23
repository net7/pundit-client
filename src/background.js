/* eslint-disable */
// function injectPundit(document: Document) {
//   const punditElement = document.createElement('pnd-root');
//   const body = document.querySelector('body');
//   body.appendChild(punditElement)
// }

chrome.browserAction.onClicked.addListener((tab) => {
  // chrome.tabs.sendMessage(tab.id, { text: 'get_dom' }, injectPundit);
  chrome.tabs.sendMessage(tab.id, { text: 'get_dom' });
});
