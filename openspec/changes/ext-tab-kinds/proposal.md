## Why

The extension's background reacts to every tab (created, activated, updated) with the same steps: it checks whether the URL is a PDF, redirects to or from the PDF viewer, and tells the tab's content script whether Pundit is active. Those steps only make sense on web pages and on the extension's own PDF viewer. On every other tab (`chrome://…`, `about:blank`, the new tab page, other extensions' pages, the Chrome Web Store) they fail and fill the service worker's console with errors, and clicking the icon there marks the tab active and lights the icon although Pundit cannot start. When the same tab later opens a website, Pundit starts on it without being asked.

Three fixes already guard the single steps (PDF detection only on web URLs, no message to the viewer, missing receivers handled). This change moves the decision to where it belongs: the background works out what kind of tab it is dealing with before doing anything.

## What Changes

- The background classifies a tab from its URL as `viewer` (the extension's PDF viewer), `feed-web` / `feed-pdf` (the feed's URLs), `web` (http and https pages, and `file://` pages) or `unsupported` (everything else, the Chrome Web Store included).
- On an `unsupported` tab the background does nothing but show Pundit as unavailable: no PDF check, no message, no redirect, no stored active state. The extension's action is disabled on that tab, so the icon is greyed out and a click does nothing. It is enabled again as soon as the tab opens a supported URL.
- The steps for the other kinds stay as they are today, each one only on the kinds it applies to.
- Tab updates are acted on only when the tab's URL changes or its page finishes loading, not on every intermediate update.

## Capabilities

### New Capabilities

- `chrome-ext-tab-handling`: how the extension's background treats a tab according to its kind: which tabs can be activated, the PDF check and redirects, the state message to the content script, the action's icon and availability, and which tab updates it reacts to.

### Modified Capabilities

None.

## Impact

- `src/chrome-ext/src/background/helpers`: new tab classifier; `checkActiveState.ts` branches on the tab kind; `isPdfDocument.ts`, `isPdfViewer.ts`, `isFeedPdfUrl.ts`, `isFeedWebUrl.ts` are used by the classifier; `updateExtensionIcon.ts` gains the unavailable state.
- `src/chrome-ext/src/background/handlers`: `onBrowserActionClicked.ts` (no active state on unsupported tabs), `onTabUpdated.ts` (reacts to URL change or load complete), `listener.ts` (passes the update info).
- No change to the content script, the Angular app, the manifest or the permissions.
- Visible to the user: the icon is greyed out and not clickable on browser pages, the new tab page and the Chrome Web Store.
