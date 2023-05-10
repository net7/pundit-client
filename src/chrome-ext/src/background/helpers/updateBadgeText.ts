export const updateBadgeText = (tabId: number, total: number) => {
  chrome.action.setBadgeText({
    tabId,
    text: total ? `${total}` : ''
  });
};
