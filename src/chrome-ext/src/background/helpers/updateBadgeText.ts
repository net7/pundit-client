export const updateBadgeText = (tabId: number, total: number) => {
  chrome.browserAction.setBadgeText({
    tabId,
    text: total ? `${total}` : null
  });
};
