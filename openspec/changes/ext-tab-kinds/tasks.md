## 1. Tab classifier

- [ ] 1.1 `helpers/getTabKind.ts`: `viewer`, `feed-web`, `feed-pdf`, `web`, `unsupported` from the URL, in that order; extension stores (Chrome, Edge) and unparsable URLs `unsupported`, any scheme other than http/https/file `unsupported` (design D1)
- [ ] 1.2 Export it from `helpers/index.ts`
- [ ] 1.3 Specs: each kind, including `chrome://extensions`, `edge://newtab`, `about:blank`, another extension's page, `file://`, the Chrome Web Store, Edge Add-ons, an empty URL

## 2. Unsupported tabs

- [ ] 2.1 `updateExtensionIcon.ts`: an unavailable state that disables the action, with the inactive icon, an empty badge and the title "Pundit is not available on this page"; the other states enable it (design D2)
- [ ] 2.2 `checkActiveState.ts`: on `unsupported` only the unavailable icon, nothing else (design D4)
- [ ] 2.3 `onBrowserActionClicked.ts`: no active state stored for an `unsupported` tab
- [ ] 2.4 Specs: an unsupported tab gets no fetch, no message, no redirect, a disabled action; a click stores nothing; a tab leaving `chrome://newtab` for a website gets the action enabled again

## 3. Supported tabs

- [ ] 3.1 `checkActiveState.ts`: branch on the kind; feed, viewer and web steps as today, `StateChanged` only for `web` (design D4)
- [ ] 3.2 Specs: an active PDF without `.pdf` is redirected to the viewer; an inactive viewer goes back to the original; a web tab receives `StateChanged`, the viewer does not; feed URLs keep their redirects

## 4. Tab updates

- [ ] 4.1 `listener.ts` / `onTabUpdated.ts`: act only on `changeInfo.url` or `changeInfo.status === 'complete'` (design D3)
- [ ] 4.2 Specs: title and favicon updates are ignored; URL change and completed load are acted on

## 5. Verification

- [ ] 5.1 `npx jest`, `tsc` (app and extension) and lint clean
- [ ] 5.2 `build:chrome-ext-stage` compiles
- [ ] 5.3 In Chromium with the built extension: `chrome://extensions`, the new tab page and the Chrome Web Store show the icon greyed out (Edge too if available: `edge://` pages, Edge Add-ons) and the service worker logs nothing; a website, a PDF (arxiv) and the viewer behave as before
