## Why

Users can restrict the extension's site access from `chrome://extensions` ("On click" or "On specific sites"). The PDF viewer then downloads the document as an ordinary cross-origin request from `chrome-extension://`, which only servers sending `Access-Control-Allow-Origin` answer (arxiv.org does, most do not). The viewer shows the generic "This PDF could not be opened" page, with no hint that granting access to the site would fix it.

The same restriction can exclude the application's own site, where the BE API lives. Then every API call of the extension is a cross-origin request that the BE API refuses (CORS): the session lookup fails, no annotation loads or saves, and the client used to keep the sidebar loading forever (fixed separately: it now goes on as a guest with the generic error toast). The user gets no hint that granting access to the application's site would fix it.

## What Changes

- When a document fails to load in the extension's viewer, the viewer checks whether Pundit has access to the document's site.
- Without access, the error page says that Pundit cannot access the site and offers a button that asks the browser for access to that site only. The request needs the user's click, so it is never made on its own.
- Once access is granted, the viewer reloads and opens the document. If the user refuses, the page stays as it is.
- The page keeps the link to the original document in both cases.
- The web viewer (feed) is unchanged: it downloads through its proxy and has no extension permissions.
- When the session lookup fails in the extension and Pundit has no access to the application's site, the client shows an error toast asking for the user's permission, with an "Allow" action, instead of the generic error.
- In the PDF viewer the action asks the browser directly and reloads the viewer once access is granted. On a web page the page itself cannot ask the browser, so the action opens an extension page in a new tab next to it, with the allow button; once access is granted, that tab closes and the web page reloads.
- The embed bundle and the web viewer are unchanged: they run on the application's own site.

## Capabilities

### New Capabilities

- `pdf-viewer-site-access`: how the extension's PDF viewer reports a document it cannot load because Pundit has no access to its site, and how the user grants that access from the viewer.
- `chrome-ext-api-access`: how the extension reports that Pundit cannot reach the application's site, where the BE API lives, and how the user grants that access from the viewer or from a web page.

### Modified Capabilities

None.

## Impact

- `src/chrome-ext/assets/pdfjs/web/viewer.js`: the Pundit error page (`_punditDocumentError`) gains the site access variant.
- `src/chrome-ext/assets/pdfjs/web/viewer.css`: styles of the second button.
- `src/chrome-ext/manifest.json`: expected unchanged. Only if the browser refuses to grant back a withheld permission, either `optional_host_permissions` is added or the button opens the extension's settings instead (see design, D2); the choice is made after checking.
- Angular app: `main-layout-identity.handler.ts` (site access toast on a failed session lookup), a new `ExtensionAccessModel` in `src/common/models` with two cross-message requests, two i18n strings in `en_US.ts`.
- Background: `doCrossMessageRequest.ts` handles the two requests and passes the sender tab; a new `helpers/apiAccess.ts`.
- New extension page `site-access.html` with its script (`src/chrome-ext/src/site-access/`), built by `webpack.chrome-ext.prod.js` (stage inherits it), copied by `angular.json` (both chrome-ext configurations) and kept by `scripts/postbuild.js`.
- No change to the web viewer's build or the embed bundle.
