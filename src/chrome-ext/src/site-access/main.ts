import { getApiOrigins } from '../background/helpers/apiAccess';

/**
 * Extension page opened in a tab from a web page whose Pundit cannot reach
 * the application's site: a web page cannot ask the browser for the
 * extension's permissions, this page can, in the user's click. Once access is
 * granted it reloads the web page (`?tab=<id>`), brings it to the front and
 * closes its own tab.
 */
const tabParam = new URLSearchParams(window.location.search).get('tab');
const tabId = tabParam ? Number(tabParam) : NaN;
const button = document.getElementById('allow') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLElement;

getApiOrigins().then((origins) => {
  if (!origins) {
    // only with an invalid AUTH_BASE_URL in the build
    status.textContent = 'The address of Pundit in this build of the extension is not valid.';
    return;
  }
  button.disabled = false;
  button.onclick = () => {
    // called in the click: the browser needs the user's gesture
    chrome.permissions.request({ origins }).then((granted) => {
      if (!granted) {
        status.textContent = 'Access was not allowed. You can close this tab.';
        return;
      }
      const back = Number.isInteger(tabId)
        ? chrome.tabs.reload(tabId).then(() => chrome.tabs.update(tabId, { active: true }))
        : Promise.resolve();
      back.catch(() => undefined)
        .then(() => chrome.tabs.getCurrent())
        .then((current) => (current?.id !== undefined ? chrome.tabs.remove(current.id) : window.close()))
        .catch(() => window.close());
    }, () => {
      status.textContent = 'The browser did not ask for access. You can allow it from the extension settings.';
    });
  };
});
