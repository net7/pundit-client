// webpack build env variable: the application's address
declare const AUTH_BASE_URL: string;

/**
 * Origin pattern of the application's site, from the build: a page cannot
 * choose the origin the extension checks or asks the user to allow.
 */
export const getApiOrigins = (): Promise<string[] | null> => {
  try {
    return Promise.resolve([`${new URL(AUTH_BASE_URL).origin}/*`]);
  } catch {
    return Promise.resolve(null);
  }
};

/** Whether the extension can reach the application's site. */
export const hasApiAccess = (): Promise<boolean> => getApiOrigins().then((origins) => (
  origins ? chrome.permissions.contains({ origins }) : true
));

/**
 * Opens the extension page that asks for access to the application's site,
 * in a new tab right after `tabId`: the background has no user gesture to ask
 * the browser itself. The page reloads `tabId` once access is granted.
 */
export const openSiteAccessTab = (tabId?: number): Promise<null> => {
  if (typeof tabId !== 'number') {
    return chrome.tabs.create({ url: chrome.runtime.getURL('site-access.html') }).then(() => null);
  }
  return chrome.tabs.get(tabId).then((tab) => chrome.tabs.create({
    url: chrome.runtime.getURL(`site-access.html?tab=${tabId}`),
    windowId: tab.windowId,
    index: tab.index + 1,
    openerTabId: tabId,
  })).then(() => null);
};
