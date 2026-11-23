import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';
import {
  getTabKind,
  isPdfDocument,
  redirectToOriginalPdfUrl,
  redirectToPdfViewer,
  setExtensionUnavailable,
  updateExtensionIcon,
  getFeedPdfSource,
  getFeedWebSource,
  TabKind,
} from '.';
import { CommonEventType } from '../../../../common/types';
import { onBrowserActionClicked } from '../handlers/onBrowserActionClicked';

const handleFeedWeb = (tab: chrome.tabs.Tab, tabUrl: string, active: boolean) => {
  // redirect (getFeedWebSource already returns the decoded URL)
  chrome.tabs.update({
    url: getFeedWebSource(tabUrl),
  });
  // trigger click
  if (!active) {
    setTimeout(() => {
      onBrowserActionClicked(tab);
    });
  }
};

/** Tells the content script whether Pundit is active on the page. */
const sendState = (tabId: number, active: boolean) => {
  // a page still loading, or one where the browser runs no content script,
  // has no receiver
  chrome.tabs.sendMessage(tabId, {
    payload: { active },
    type: CommonEventType.StateChanged,
  }).catch(() => undefined);
};

/**
 * Redirects and state message for the viewer, a feed PDF URL or a web page.
 * Returns true when the icon is updated later (feed PDF activated on redirect).
 */
const handleDocument = async (
  tab: chrome.tabs.Tab,
  tabId: number,
  tabUrl: string,
  kind: TabKind,
  active: boolean,
): Promise<boolean> => {
  if (kind === 'viewer') {
    if (!active) {
      redirectToOriginalPdfUrl(tabUrl);
    }
    return false;
  }
  const isPdf = await isPdfDocument(tabUrl);
  if (kind === 'feed-pdf' && isPdf) {
    redirectToPdfViewer(getFeedPdfSource(tabUrl));
    if (!active) {
      setTimeout(() => {
        onBrowserActionClicked(tab, true);
        updateExtensionIcon(tab.id!, true);
      });
      return true;
    }
  } else if (active && isPdf) {
    redirectToPdfViewer(tabUrl);
  } else {
    sendState(tabId, active);
  }
  return false;
};

export const checkActiveState = (tabId: number) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      // do nothing
    } else {
      const { windowId } = tab;
      chrome.windows.get(windowId, (window) => {
        // popup check
        if (window.type === 'popup') {
          return;
        }
        const tabUrl = tab.url!;
        const kind = getTabKind(tabUrl);
        // a page where Pundit cannot run: no request, no message, no redirect
        if (kind === 'unsupported') {
          setExtensionUnavailable(tabId);
          return;
        }
        const activeKey = `${ChromeExtStorageKey.Active}.${tabId}`;
        (ChromeExtStorage.get(activeKey) as Promise<boolean>).then(async (active: boolean) => {
          if (kind === 'feed-web') {
            handleFeedWeb(tab, tabUrl, active);
            return;
          }
          const skipIconUpdate = await handleDocument(tab, tabId, tabUrl, kind, active);
          if (!skipIconUpdate) {
            updateExtensionIcon(tabId, active);
          }
        });
      });
    }
  });
};
