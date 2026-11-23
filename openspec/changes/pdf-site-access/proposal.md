## Why

Users can restrict the extension's site access from `chrome://extensions` ("On click" or "On specific sites"). The PDF viewer then downloads the document as an ordinary cross-origin request from `chrome-extension://`, which only servers sending `Access-Control-Allow-Origin` answer (arxiv.org does, most do not). The viewer shows the generic "This PDF could not be opened" page, with no hint that granting access to the site would fix it.

## What Changes

- When a document fails to load in the extension's viewer, the viewer checks whether Pundit has access to the document's site.
- Without access, the error page says that Pundit cannot access the site and offers a button that asks the browser for access to that site only. The request needs the user's click, so it is never made on its own.
- Once access is granted, the viewer reloads and opens the document. If the user refuses, the page stays as it is.
- The page keeps the link to the original document in both cases.
- The web viewer (feed) is unchanged: it downloads through its proxy and has no extension permissions.

## Capabilities

### New Capabilities

- `pdf-viewer-site-access`: how the extension's PDF viewer reports a document it cannot load because Pundit has no access to its site, and how the user grants that access from the viewer.

### Modified Capabilities

None.

## Impact

- `src/chrome-ext/assets/pdfjs/web/viewer.js`: the Pundit error page (`_punditDocumentError`) gains the site access variant.
- `src/chrome-ext/assets/pdfjs/web/viewer.css`: styles of the second button.
- `src/chrome-ext/manifest.json`: expected unchanged. Only if the browser refuses to grant back a withheld permission, either `optional_host_permissions` is added or the button opens the extension's settings instead (see design, D2); the choice is made after checking.
- No change to the Angular app, the background or the web viewer's build.
