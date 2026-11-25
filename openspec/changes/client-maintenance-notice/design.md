## Context

`develop` is production (v1.17.0) plus the AI whole-page annotation, staged as 1.18.0.0. This change ships with it as 1.18.0 (stage 1.18.0.1), days before the annotation server is switched off, and is then merged into `feature/new-be-api`.

The client runs in three shapes:

- **Extension on a web page**: the Angular bundle (`pundit.chrome-ext.js`) is injected into the page context by the content script (`src/chrome-ext/src/content/loadExtension.ts`). Its API calls do not run in the page: `@CrossMessage` (`src/common/cross-message.ts`) forwards them as `CrossMsgRequest` events to the content script, which relays them to the background service worker. The background runs the model (`doCrossMessageRequest.ts`) with the extension's `host_permissions: ["<all_urls>"]`, out of reach of the page's CORS and CSP.
- **Extension pages** (PDF viewer, `chrome-extension://` origin): `crossMessageEnabled()` is false, so models run in the page, which already has the extension's permissions.
- **Embed and web/PDF standalone builds**: the bundle runs on a third-party (or the feed) origin and calls the API directly.

The server half exists in pundithomex (`feature/client-status`, design `docs/superpowers/specs/2026-11-24-client-status-notice-design.md`):

```json
{ "version": 1,
  "notices": [{ "id": "maintenance", "active": true, "level": "maintenance",
                "appliesTo": { "maxClientVersion": "1.18.0" } }] }
```

`notices` is empty while `CLIENT_NOTICE_ACTIVE=false`. `appliesTo` appears only when `CLIENT_NOTICE_MAX_CLIENT_VERSION` is set. The server provides no text, link, dates or `blockActions`: maintenance means the client stops signing in and writing, and the client owns the text.

Startup today:

1. `MainLayoutIdentityHandler.doInitRequest()` runs the session lookup (SSO).
2. It then emits `GetUserData` or `GetPublicData` (`main-layout.eh.ts`).
3. `AppEvent.Refresh` (URL navigation) reloads the data the same way.

## Goals / Non-Goals

**Goals:**
- Switch a maintenance notice on and off from the server, for clients already installed.
- Show "under maintenance" during the release, then "update the extension" only to old versions.
- Replace endless loaders and error toasts with an explanation while the API is unreachable.
- Keep the client exactly as it is when no notice applies or no status URL is configured.

**Non-Goals:**
- Server changes (the contract exists) and deployment changes (described below, done in pundit-deployment).
- Several notices at once, non-maintenance levels, server-provided text, links or time windows.
- Italian text: `it_IT.ts` is empty and the client runs in `en_US` only.
- The extension badge: the background's page-annotations count (`doPageAnnotationsRequest`) keeps failing silently as today.

## Decisions

### D1. Status URL: `statusUrl` in the app, `STATUS_URL` in the background

The app reads `statusUrl` (optional, new in `LocalConfig`) and the extension background reads the build constant `STATUS_URL` (webpack `DefinePlugin`, like `API_BASE_URL`, with the stage override in `chrome-ext-urls.stage.js`). An empty value switches the feature off.

**Why the background does not take the URL from the page**: any page can dispatch `CrossMsgRequest` events. If the background fetched a URL sent with the request, any site could make it read arbitrary URLs with the `<all_urls>` permission. The request id carries no argument the background uses.

**Alternative**: one source, passed in `InitCommunicationSettings` like `apiBaseUrl`. Rejected for the reason above.

### D2. One model for both paths: `ClientStatusModel.get()`

A new `ClientStatusModel` in `src/common/models`, decorated with `@CrossMessage(CrossMsgRequestId.ClientStatusGet)`:

- **On a web page in the extension**: the call goes to the background, whose handler calls the model with `STATUS_URL`.
- **Elsewhere**: it runs in place with `statusUrl`.

The model:
- calls `fetch(url + '?_=' + Date.now(), { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(3000) })`;
- returns the parsed JSON, or `null` on any failure;
- never rejects.

No custom header is sent, so the embed's cross-origin request is a simple request without a preflight. The server answers `Access-Control-Allow-Origin: *`.

The page side also races the call against a 3.5 s timer, because a relayed message whose answer never comes back would otherwise leave the promise pending.

**Alternative**: Angular `HttpClient`. Rejected: models in `src/common` must run in the background too, where Angular is not available.

### D3. Pure parsing and matching

`parseClientStatus(json)` and `noticeApplies(notice, clientVersion)` are pure functions in `src/app/helpers`:

- `parseClientStatus` returns `{ notice: MaintenanceNotice | null }` or `null` for an invalid response;
- `MaintenanceNotice` is `{ id, outdated: boolean }`, where `outdated` means `maxClientVersion` was valid and matched.

Version comparison:
- splits on `.`, integers only;
- compares the first N segments of the client's version, where N is the number of segments of `maxClientVersion`. Missing segments count as 0.

With this, `"1.18.0"` covers 1.18.0 and every stage 1.18.0.N, and `"1.18"` covers 1.18.x.

An invalid `maxClientVersion` or unknown client version → the notice applies with `outdated: false`. When unsure, showing the maintenance text is safer than showing nothing to a client whose API is down.

### D4. Client version

- **Extension on a web page**: the content script adds `version: chrome.runtime.getManifest().version` to the `PunditLoaded` event (today `{ id }`). `ChromeExtService` stores it as `config.set('clientVersion', …)`.
- **Extension pages**: `chrome.runtime.getManifest()` directly.
- **Other builds**: `package.json` `version`, as `AnalyticsModel` already does.

`package.json` is not used in the extension: on stage it still holds the last production version (1.17.0), while the installed manifest is 1.18.0.1.

### D5. `MaintenanceService`: state, cache, polling

`MaintenanceService` (root injectable) holds:

- `notice$: BehaviorSubject<MaintenanceNotice | null>`;
- the last valid status;
- the time of the last read.

`refresh(force?)`:
- reuses a read younger than 60 s unless forced;
- otherwise calls the model and parses the response;
- on success, stores the status and emits the notice;
- on failure (`null`), keeps the last valid status, or no notice if there is none;
- never throws.

Polling:
- every 5 minutes, skipped while `document.visibilityState === 'hidden'`;
- also on `visibilitychange` back to visible (through the 60 s cache).

`ready(): Promise<void>` resolves after the first read (success or failure), so at most after ~3.5 s.

**Failure policy (decided)**: last valid status in memory. A flaky network does not make the notice flicker, and a page reload with the server unreachable gives no notice (fail-open).

**Alternative**: persist the last status (`chrome.storage`). Rejected: an old blocking notice could outlive the server's switch-off.

### D6. The notice takes Pundit's place

`AppComponent` renders either the notice or `main-layout` (the whole of Pundit: sidebar, tooltip, modals, toasts, login):

```html
@if (ready$ | async) {
  @if (maintenance$ | async; as maintenance) {
    <pnd-maintenance-notice [data]="maintenance"></pnd-maintenance-notice>
  } @else {
    <main-layout></main-layout>
  }
}
```

- **Startup**: `ready$` is `true` at once without a status URL, so Pundit starts as before. With a status URL it turns `true` after the first read (at most ~3.5 s), so Pundit does not start, and makes no call, during a maintenance.
- **Switched on during a session**: `main-layout` is destroyed. Its layout already cleans up on destroy (it is built for `PunditDestroy`). `AppComponent` also removes what it leaves on the page: the selection tooltip, the highlights (`anchorService.removeAll()`), the loaded annotations and the body class of the expanded sidebar.
- **Switched off**: `main-layout` is created again and starts as on load (session lookup, then data), without a page reload.

**Why stop Pundit entirely**: in every case where the notice is on, the API of the client that sees it does not answer:
- release day: the annotation server is off, or `/api` answers 503;
- after the release: old versions point to a server that no longer exists;
- future maintenance of the new version: `/api` answers 503.

With the API down, Pundit can show nothing and save nothing, so hiding it loses nothing and replaces errors with the explanation. It needs no extra field on the server.

**Alternative (implemented first, then dropped)**: keep Pundit running, gate the data loads and block each write at its entry point (tooltip, modals, panels, replies, likes, notebooks, ontologies), with a toast. It touched about 20 files and every future write would need its own guard. Rejected for this simpler version.

**Trade-off**: with a status URL configured, Pundit starts after the status answer, which is usually tens of milliseconds and at most ~3.5 s.

### D7. Notice and texts

A new standalone, OnPush component `pnd-maintenance-notice`, rendered by `AppComponent` in place of `main-layout`. It reuses the markup and the classes of Pundit's sidebar, so it looks like Pundit, with only the notice in it:
- the Pundit logo opens and closes the sidebar, which pushes the page aside like Pundit's (body class of the expanded sidebar); it starts open;
- the header shows a short status where the user name would be (a warning dot and "Maintenance", "Update required" or "Reload required"), and Pundit's actions (whole page, notebooks, ontologies) disabled, with the tooltip "Not available right now", next to the working close button;
- the content is the notice, title and text, `role="alert"`, part of the sidebar (warning border on the left, no card), never dismissible;
- while the sidebar is collapsed, a warning dot on the logo names the notice;
- a warning toast with the same title and text, through the real `ToastService` and `pnd-toast`, dismissible and closing after 10 s.

When the notice is switched on during a session, `AppComponent` closes Pundit's own toasts first, so that only the notice's toast shows.

Keys in `en_US.maintenance.ts`, spread into `en_US.ts`:

| Key | Text |
|---|---|
| `maintenance#title` | Pundit is under maintenance |
| `maintenance#text` | Annotations are not available for now. Please try again later. |
| `maintenance#outdated_ext_title` | Update Pundit |
| `maintenance#outdated_ext_text` | This version of Pundit no longer works. Chrome installs the new version automatically as soon as it is available. Until then, annotations are not available. |
| `maintenance#outdated_embed_title` | Pundit has been updated |
| `maintenance#outdated_embed_text` | Reload the page to keep annotating. |
The notice `id` is not used for dismissal: the notice replaces Pundit, so it is never dismissible.

## Server contract (pundithomex, already implemented)

The client relies on:

- **URL**: `GET <APP_URL>/api/client-status`, public, no session, no cookie.
- **`Content-Type`**: `application/json`.
- **CORS**: `Access-Control-Allow-Origin: *` on `api/*` (`config/cors.php`) for the embed on any origin and for `chrome-extension://<id>`. The extension's background does not need it, but extension pages send `Origin`.
- **Cache**: `Cache-Control: no-cache, no-store, must-revalidate`.
- **Answered during `php artisan down`** (`preventRequestsDuringMaintenance` exception).
- **Rate limit**: 60 requests a minute per IP, on a counter of its own. Users behind a single NAT share it: 300 visible tabs polling every 5 minutes reach it. A 429 is a failed read (last known status), so the effect is a delay, not a wrong notice.

## Deployment requirements (pundit-deployment)

- **`render-env.sh` / templates**: write `statusUrl: '<APP_URL>/api/client-status'` into `local.stage.ts` and `local.prod.ts`, and `STATUS_URL` into `chrome-ext-urls.stage.js`.
- **Values**: `<APP_URL>` is `https://app.thepund.it` in production (the `authBaseUrl` of `local.prod.ts`, and the `API_BASE_URL` of `feature/new-be-api`) and `https://app.thepund.netseven.work` on stage.
- **`webpack.chrome-ext.prod.js`**: `STATUS_URL: 'https://app.thepund.it/api/client-status'`, next to `API_BASE_URL`.
- **`webpack.chrome-ext.stage.js`**: default `STATUS_URL: 'https://app.thepund.netseven.work/api/client-status'`, overridable from `chrome-ext-urls.stage.js` like the other URLs.
- **Nginx**: if a maintenance page is ever served at the nginx level (not `php artisan down`), `/api/client-status` must be excluded and still reach PHP. Without PHP the client shows no notice.

## Release runbook

1. Publish 1.18.0 to the store with `CLIENT_NOTICE_ACTIVE=false`.
2. Release day:
   - set `CLIENT_NOTICE_ACTIVE=true`, `CLIENT_NOTICE_MAX_CLIENT_VERSION=` empty, then `php artisan config:cache`;
   - within 5 minutes (or when the tab becomes visible again) every client shows "under maintenance";
   - switch off the annotation server.
3. As soon as the new API and the new embed (≥ 1.19.0) are online, even while the new extension is still in review on the store:
   - set `CLIENT_NOTICE_MAX_CLIENT_VERSION=1.18.0`, then `php artisan config:cache`;
   - the new embed sees no notice and works; pages still running the old embed show "Reload the page", which loads the new one;
   - old extensions (≤ 1.18.0.x) show "Update Pundit". Its text makes no promise about when: "Chrome installs the new version automatically as soon as it is available. Until then, annotations are not available." It stays true during the review;
   - new extensions (≥ 1.19.0), once published and installed, see nothing.
4. When almost everyone has updated: `CLIENT_NOTICE_ACTIVE=false`.

## Manual test

1. Static file standing in for the server:
   ```bash
   mkdir -p /tmp/pundit-status && cd /tmp/pundit-status
   echo '{"version":1,"notices":[{"id":"maintenance","active":true,"level":"maintenance"}]}' > client-status
   npx http-server -p 8089 --cors -c-1
   ```
2. Point `statusUrl` in `local.stage.ts` (embed, `npm start`) and `STATUS_URL` in `chrome-ext-urls.stage.js` (extension) to `http://localhost:8089/client-status`, then build.
3. Check:
   - the notice in a Pundit sidebar, with the toast, and Pundit's actions disabled;
   - no SSO or search request in the Network panel.
4. Edit the file, then wait for the next read: up to 5 minutes, or switch to another tab and back after 60 seconds:
   - add `"appliesTo":{"maxClientVersion":"1.18.0"}` → "Update Pundit" on a 1.18.0.x extension;
   - change it to `"1.17.0"` → no notice;
   - empty `notices` → Pundit starts and loads the session and the data without reloading the page;
   - back to the notice → Pundit stops and its highlights disappear;
   - stop the server → the last state stays until the page is reloaded.
5. Against pundithomex: `CLIENT_NOTICE_ACTIVE=true` and `php artisan config:cache`, with `statusUrl` pointing at the local app.

## Risks / Trade-offs

- [The embed sees "update" texts while its old bundle is still online] → the embed text is "Reload the page", which is right once the new embed is deployed; the runbook redeploys the embed before setting `maxClientVersion`.
- [PHP down: no notice, old errors come back] → accepted by the server design; nginx-level maintenance must not cover the route.
- [The host page's CSP `connect-src` blocks the embed's request] → failed read, no notice; same limit as every embed API call today.
- [Startup slower by the status request] → bounded at ~3.5 s, usually far less; no change without a status URL.
- [Shared-IP rate limit] → 429 is a failed read; polling skips hidden tabs.
- [A notice switched on during a session discards the user's unsaved work (an open edit modal)] → the API does not answer at that point, so the work could not be saved anyway.

## Migration Plan

- Merge into `develop` and release as 1.18.0 (stage 1.18.0.1) before the switch-off, with the deployment changes above.
- Merge into `feature/new-be-api`:
  - `statusUrl` is the same `<APP_URL>/api/client-status`;
  - the change does not touch the layouts, so it does not conflict with the site-access toast of the identity handler there (`feat(identity)`).
- Rollback: `CLIENT_NOTICE_ACTIVE=false`. With an empty `statusUrl`/`STATUS_URL` the client is the old one.

## Open Questions

None. The texts of D7 are approved.
