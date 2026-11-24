## 1. Permission behaviour

- [x] 1.1 In Chrome with the built extension and site access set to "On specific sites": confirm that `chrome.permissions.contains` answers `false` for a withheld origin and that `chrome.permissions.request` for it shows the prompt and grants it (design D2)
- [x] 1.2 Not needed, 1.1 passed. If 1.1 fails: choose with the team between fallback (a) `optional_host_permissions` in the manifest and (b) a button that opens the extension's settings (design D2), update spec and tasks, and repeat 1.1 for (a)

## 2. Error page

- [x] 2.1 `viewer.js` `_punditDocumentError()`: for an http(s) source and where `chrome.permissions` exists, check access to `<origin>/*`; without access build the site access variant, otherwise today's page (design D1, D3)
- [x] 2.2 Allow button: `chrome.permissions.request` for the origin in the click handler; reload on `true`, nothing on `false` or rejection (design D2)
- [x] 2.3 `viewer.css`: secondary style for the "Open the original document" link in the site access variant

## 3. Access to the application's site

- [x] 3.1 `ExtensionAccessModel` (`src/common/models`): `hasApiAccess()` and `requestApiAccess()`, cross-message requests with new `CrossMsgRequestId`s; without `chrome.permissions` `hasApiAccess()` answers true (design D4, D6)
- [x] 3.2 Background: `doCrossMessageRequest` passes the sender tab to the handlers; `helpers/apiAccess.ts` answers `contains` and opens `site-access.html?tab=<id>` in a new tab after the sender tab (design D6)
- [x] 3.3 `site-access.html` and `src/chrome-ext/src/site-access/main.ts`: "Allow" button, `chrome.permissions.request`, reload the web page's tab, bring it to the front and close the extension tab on grant; webpack entry, `angular.json` assets for both chrome-ext configurations, `postbuild.js` allowed files
- [x] 3.4 `main-layout-identity.handler.ts`: on a failed session lookup other than 401, the site access toast when access is missing, the generic toast otherwise; public data in both cases (design D4, D5)
- [x] 3.5 i18n: `toast#site_access_title`, `toast#site_access_text`, `toast#site_access_action` in `en_US.ts`
- [x] 3.6 Specs: `hasApiAccess` with and without `chrome.permissions`; the identity handler shows the site access toast or the generic one; the background handler opens the extension tab after the sender tab

## 4. Verification

- [x] 4.1 `build:chrome-ext-stage` and `build:pdf-standalone-stage` compile
- [ ] 4.2 Chrome, site access on all sites: arxiv and the w3.org dummy PDF load; a 404 shows the generic page
- [ ] 4.3 Chrome, site access "On specific sites" without w3.org: the w3.org dummy PDF shows the site access page; allowing reloads and opens the PDF; refusing leaves the page; arxiv still loads
- [x] 4.4 Web viewer under `/pdf-viewer/`: a failure shows the generic page, no error from `chrome.permissions`
- [ ] 4.5 If available, repeat 4.3 in Edge
- [ ] 4.6 Chrome, site access without the application's site: the viewer shows the site access toast, "Allow" asks the browser and the viewer reloads signed in; on a web page with Pundit active the toast opens the extension tab next to it, allowing there closes it and reloads the page; refusing leaves the tab open
- [ ] 4.7 Embed through the feed and web viewer: a failed session lookup still shows the generic toast
