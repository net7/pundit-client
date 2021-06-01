import { CommonEventType } from '../../../../common/types';

const toDataURL = (url) => fetch(url)
  .then((response) => response.blob())
  .then((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }));

export const doImageDataRequest = (tab: chrome.tabs.Tab, payload) => {
  const { id: tabId } = tab;
  const { url } = payload;

  toDataURL(url)
    .then((data: string) => {
      chrome.tabs.sendMessage(tabId, {
        type: CommonEventType.ImageDataResponse,
        payload: { url, data }
      });
    }).catch((err) => {
      console.warn('ImageData request error', err);
      chrome.tabs.sendMessage(tabId, {
        type: CommonEventType.ImageDataResponse,
        payload: { url, error: true }
      });
    });
};
