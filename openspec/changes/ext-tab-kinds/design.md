## Context

The service worker listens to `tabs.onCreated`, `tabs.onActivated`, `tabs.onUpdated` and `action.onClicked`. All of them end in `checkActiveState(tabId)`, which reads the tab's stored active state (`active.<tabId>`) and its URL, then:

1. for feed URLs, redirects to the document and may activate Pundit;
2. checks whether the URL is a PDF (`isPdfDocument`);
3. redirects an active PDF to the viewer, or an inactive viewer to the original;
4. otherwise sends `StateChanged` to the tab's content script;
5. updates the icon and badge.

None of these steps looks at what kind of page the tab shows. On browser pages, the new tab page, other extensions' pages and the Chrome Web Store, steps 2 and 4 fail, and step 5 lights the icon after a click although Pundit cannot run there. `onUpdated` fires several times per page load, so each failure repeats.

Three commits already guard the single steps: `isPdfDocument` fetches only http(s) URLs and only the headers, the viewer gets no `StateChanged`, and a missing receiver is handled. They stay as defence in depth.

## Goals / Non-Goals

**Goals:**

- One place decides the tab's kind, and every step runs only on the kinds it applies to.
- On unsupported tabs Pundit is visibly unavailable and leaves no state behind.
- Fewer checks per page load.

**Non-Goals:**

- Changing what happens on web pages, the viewer or the feed URLs.
- The missing site access case (host permission revoked by the user): it is a separate change.
- Content script, Angular app, manifest or permissions.

## Decisions

### D1. A pure classifier, `getTabKind(url)`

`getTabKind(url): 'viewer' | 'feed-web' | 'feed-pdf' | 'web' | 'unsupported'` lives in `helpers/getTabKind.ts` and reuses `isPdfViewer`, `isFeedWebUrl` and `isFeedPdfUrl`. The order matters: the viewer and the feed URLs are recognised before the generic `web` kind, since the feed URLs are https too. A URL that does not parse is `unsupported`.

`file:` counts as `web`: the content script and the PDF redirect already work there when the user allows file access, and the viewer shows its existing modal when they do not.

Supported schemes are listed (`http:`, `https:`, `file:`) rather than unsupported ones excluded: every Chromium-based browser that installs the extension (Chrome, Edge, Brave, Opera, Vivaldi, Arc) has its own internal schemes (`edge://`, `brave://`, `opera://`, …), and they all fall into `unsupported` without being named.

The extension stores are `https` but browsers do not run content scripts on them, so they are listed explicitly as `unsupported`: the Chrome Web Store (`chromewebstore.google.com`, `chrome.google.com/webstore`, also used by Brave, Vivaldi and Arc) and Edge Add-ons (`microsoftedge.microsoft.com/addons`).

*Alternative considered:* asking Chrome whether the content script can run (`chrome.scripting.executeScript` and checking the error). It needs the `scripting` permission and an asynchronous round trip on every update, for the same answer the URL already gives.

### D2. Unsupported tabs: action disabled

On an `unsupported` tab `checkActiveState` stops after setting the icon: `chrome.action.disable(tabId)`, inactive icon, empty badge, title "Pundit is not available on this page". On any supported kind it calls `chrome.action.enable(tabId)` first. A disabled action shows a greyed-out icon and ignores clicks, so the tab never gets an active state.

`onBrowserActionClicked` also checks the kind and returns without storing anything for an `unsupported` tab, in case a click arrives before the action was disabled (a tab opened before the service worker started).

The title string is new but lives in the background's `IconTitle` table with the others, which is not translated.

*Alternative considered:* leaving the action enabled and ignoring the click. The user clicks and nothing happens, with no hint why; a greyed-out icon is the usual way extensions say "not here".

### D3. `onUpdated` reacts to URL changes and completed loads

The listener passes `(tabId, changeInfo)`. `onTabUpdated` acts only when `changeInfo.url` is set or `changeInfo.status === 'complete'`. Title, favicon, audible and similar updates are ignored. A completed load is still needed: the content script exists only from `document_end`, and `StateChanged` sent at the URL change can find no receiver.

### D4. `checkActiveState` branches on the kind

```
kind = getTabKind(tab.url)
unsupported  → disable action, inactive icon; stop
otherwise    → enable action
feed-web     → today's feed web redirect
viewer       → inactive: redirect to the original
feed-pdf     → today's feed PDF redirect
web          → isPdfDocument; active PDF: redirect to viewer; else StateChanged
             → icon and badge
```

The existing helpers keep their guards, so a call from elsewhere stays safe.

## Risks / Trade-offs

- [A site served on http(s) where Chrome still blocks content scripts, other than the Web Store] → it is classified `web`: the click stores an active state and the icon lights up as today, with the missing receiver already handled. Add it to the list when found.
- [A tab whose URL is still empty when created] → `unsupported` until its first URL update, which re-enables the action. The icon is briefly greyed out on new tabs that then open a website.
- [Tabs that were active on a page that becomes unsupported] → their stored active state is kept, as today when navigating; the action is disabled while on the unsupported page and shows the stored state again when the tab returns to a website.

## Migration Plan

Ships with the next extension release; no data migration. Stored `active.<tabId>` keys are unaffected. Rollback: previous release.

## Open Questions

- Does Opera block content scripts on `addons.opera.com`? If so, add it to the stores. Until then, a click there behaves as today: the icon lights up and Pundit does not start, with no error.
