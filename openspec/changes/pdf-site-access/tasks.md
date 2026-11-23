## 1. Permission behaviour

- [ ] 1.1 In Chrome with the built extension and site access set to "On specific sites": confirm that `chrome.permissions.contains` answers `false` for a withheld origin and that `chrome.permissions.request` for it shows the prompt and grants it (design D2)
- [ ] 1.2 If 1.1 fails: choose with the team between fallback (a) `optional_host_permissions` in the manifest and (b) a button that opens the extension's settings (design D2), update spec and tasks, and repeat 1.1 for (a)

## 2. Error page

- [ ] 2.1 `viewer.js` `_punditDocumentError()`: for an http(s) source and where `chrome.permissions` exists, check access to `<origin>/*`; without access build the site access variant, otherwise today's page (design D1, D3)
- [ ] 2.2 Allow button: `chrome.permissions.request` for the origin in the click handler; reload on `true`, nothing on `false` or rejection (design D2)
- [ ] 2.3 `viewer.css`: secondary style for the "Open the original document" link in the site access variant

## 3. Verification

- [ ] 3.1 `build:chrome-ext-stage` and `build:pdf-standalone-stage` compile
- [ ] 3.2 Chrome, site access on all sites: arxiv and the w3.org dummy PDF load; a 404 shows the generic page
- [ ] 3.3 Chrome, site access "On specific sites" without w3.org: the w3.org dummy PDF shows the site access page; allowing reloads and opens the PDF; refusing leaves the page; arxiv still loads
- [ ] 3.4 Web viewer under `/pdf-viewer/`: a failure shows the generic page, no error from `chrome.permissions`
- [ ] 3.5 If available, repeat 3.3 in Edge
