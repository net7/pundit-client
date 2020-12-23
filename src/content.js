/* eslint-disable */
// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg.text === 'get_dom') {
//     console.log('document received: ', document)
//     sendResponse(document);
//   }
// });

console.log('content script loaded!')
// console.log(document)
// const body = document.querySelector('body');
// const pundit = document.createElement('div');
// const debugHeader = document.createElement('h2');
// debugHeader.innerHTML = 'Pundit loaded.';
// body.prepend(pundit);
// body.prepend(debugHeader);
// fetch(chrome.runtime.getURL('/src/index.html'))
//   .then(res => res.text())
//   .then(data => {
//     pundit.innerHTML = data;
//   })
//   .catch(err => {
//     console.error(err)
//   })

// var injectedContent = document.createElement("pnd-root");
// injectedContent.setAttribute("ng-include", "");
//ng-include src value must be wrapped in single quotes
// injectedContent.setAttribute("src", "'" + chrome.extension.getURL("src/index.html") + "'");
// pundit.appendChild(injectedContent);

// https://www.red-gate.com/simple-talk/dotnet/software-tools/developing-google-chrome-extension-using-angular-4/
// https://www.angulararchitects.io/aktuelles/your-options-for-building-angular-elements/

// let s = document.createElement('script');
// s.type = 'text/javascript';
// s.src = chrome.runtime.getURL('main.js');
// s.onload = function() {
//     this.parentNode.removeChild(this);
// };
// try {
//     (document.head || document.documentElement).appendChild(s);
// } catch (e) {
//     console.log(e);
// }


var injectedContent = document.createElement("pnd-root");
document.body.appendChild(injectedContent);
// injectedContent.setAttribute("ng-include", "");
//ng-include src value must be wrapped in single quotes
// injectedContent.setAttribute("src", "'" + chrome.extension.getURL("src/index.html") + "'");
// pundit.appendChild(injectedContent);

var main = document.createElement('script');
main.src = chrome.extension.getURL('main.js');
(document.head||document.documentElement).appendChild(main);
main.onload = function() {
    main.remove();
};

var styles = document.createElement('script');
styles.src = chrome.extension.getURL('styles.js');
(document.head||document.documentElement).appendChild(styles);
styles.onload = function() {
    styles.remove();
};