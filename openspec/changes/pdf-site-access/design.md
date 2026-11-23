## Context

The extension's manifest declares `host_permissions: ["<all_urls>"]` and a content script on `<all_urls>`. Since Chrome lets users withhold host access ("On click", "On specific sites"), a required host permission can be missing at runtime.

The PDF viewer (`chrome-extension://<id>/pdf-viewer.html?source=<url>`) downloads the document with pdf.js from the extension page. With access to the site, the request is privileged and CORS does not apply. Without it, the request is a plain cross-origin fetch from `chrome-extension://`: it succeeds only when the server sends `Access-Control-Allow-Origin`, and otherwise fails as a network error.

A document that fails to load shows the Pundit error page built by `_punditDocumentError()` in `viewer.js` (commit 115985c): a title, a sentence and a link to the original document. The web viewer served by the feed runs the same `viewer.js`, downloads through the same-origin proxy (`fetchUrl`) and has no `chrome.permissions`.

## Goals / Non-Goals

**Goals:**

- Tell the user why the PDF did not open when site access is the cause, and let them fix it with one click.
- Ask for as little as possible: the document's origin, not all sites.

**Non-Goals:**

- Web pages with withheld access (the content script does not run there; Chrome's own "On click" flow covers it).
- The service worker's API calls when the application's host is withheld.
- Requesting access before loading (it needs a user gesture anyway).
- The web viewer.

## Decisions

### D1. The check lives in the Pundit error page of `viewer.js`

`_punditDocumentError()` becomes asynchronous in its content: it builds the page, and when `chrome?.permissions?.contains` exists and the source is http(s), it calls `chrome.permissions.contains({ origins: [origin + '/*'] })`. On `false` it fills the page with the site access variant; otherwise with today's generic content. Checking after the failure, rather than before loading, keeps the normal path untouched and costs one call only when something already went wrong.

The check runs for every load failure of an http(s) source, not only for network errors: without access a server's 404 or 403 is not readable either (the response is blocked by CORS), so the failure kind does not tell the cases apart.

*Alternative considered:* the Angular `pdf-error-modal`, as for `file://` access. The error page already sits in `viewer.js`, in place of the document; a modal on top of it would show two messages for one problem.

### D2. Asking for the origin with `chrome.permissions.request`

The button calls `chrome.permissions.request({ origins: [origin + '/*'] })` in its click handler, so the browser sees the user gesture. On `true` the viewer calls `location.reload()`; on `false` or a rejection it does nothing.

When the user restricts site access, Chrome withholds the declared host permission rather than removing it, and lets the extension request a withheld permission with `chrome.permissions.request`; granting it adds the site to the user's allowed list. The manifest is then left as it is. This is expected from Chrome's behaviour but not yet confirmed, so it is checked before implementing (task 1.1).

If the check fails, one of two fallbacks is chosen then:

- **(a) `optional_host_permissions: ["<all_urls>"]` in the manifest.** It makes any origin requestable and keeps the one-click flow. Optional permissions show no warning at install or update, so the extension is not disabled on update. The cost is a manifest change, redundant with the existing `host_permissions`, that goes through the Chrome Web Store review (and Edge Add-ons, if published there).
- **(b) The button opens the extension's settings** (`chrome://extensions/?id=<id>` through `chrome.tabs.update`), as the viewer already does for file access. The manifest is unchanged, but the user has to find the site access option, come back and reload.

### D3. Page content

Same layout and styles as the generic page, with:

- title: "Pundit cannot access this site";
- text: "To open this PDF, Pundit needs access to `<host>`. You can allow it, or open the document on its site.";
- primary button: "Allow access to `<host>`";
- secondary link: "Open the original document" (today's link, styled as a secondary button);
- the source URL in small print, as today.

Strings are in English, as the rest of the viewer.

## Risks / Trade-offs

- [The browser refuses to grant back a withheld required permission] → fallback (a) or (b) of D2, chosen after task 1.1, before implementing.
- [Granting one origin while the user chose "On click"] → Chrome adds the site to the allowed list, which is what the user asked for by clicking; other sites keep the user's choice.
- [Non-Chromium-identical behaviour in Edge, Brave, Opera] → the permissions API is the same Chromium API; the prompt's look differs. Checked in Chrome only, others noted in the verification task.
- [A document that fails for another reason on a site without access] → the user grants access, the viewer reloads and shows the generic page for the real error. Acceptable: access was missing anyway.

## Migration Plan

Ships with the next extension release. If D2 needs `optional_host_permissions`, the manifest change takes effect on update without a new permission warning. Rollback: previous release.

## Open Questions

- Does `chrome.permissions.request` grant back a withheld required host permission on the Chrome versions we support? Answered by task 1.1. If not: fallback (a) `optional_host_permissions` or (b) the button opens the extension's settings (D2).
