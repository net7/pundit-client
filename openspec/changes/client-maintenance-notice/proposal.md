## Why

The annotation server (`https://api.thepund.it/`) will be switched off and the API moves to the web application (`<APP_URL>/api`), which needs a new extension. Between the switch-off and the moment users get the updated extension (Chrome Web Store review, then auto-update), the installed extensions stop working with no explanation: endless loaders and "Oops! Something went wrong" toasts.

This version, published on the store days before the switch-off, lets the server switch on a maintenance notice remotely, without publishing a new client. The web application already answers it: `GET <APP_URL>/api/client-status` (pundithomex, branch `feature/client-status`).

## What Changes

- The client reads the notice from a URL configured per environment (`statusUrl`). It reads the notice at startup, every 5 minutes and when the page becomes visible again. The request has a 3 s timeout, no cookies, no authentication, no referrer and no browser cache, and results are kept in memory for 60 s.
- In the extension the request goes through the background service worker, like the API calls. The URL is fixed in the background bundle, never taken from the page.
- A notice applies to this client when it is active, of level `maintenance`, and either has no `appliesTo.maxClientVersion` or the client's version is up to that version. The client's version comes from the installed manifest in the extension and from `package.json` in the embed.
- While a notice applies, Pundit is not started: a sidebar in Pundit's style, with the notice in it and Pundit's actions disabled, and a toast take its place. There is no selection tooltip, no modal and no API call, so there is no action to block one by one.
- The text depends on the notice, in English:
  - without `maxClientVersion`, "Pundit is under maintenance";
  - with it, the extension asks to update the extension and the embed asks to reload the page.
- When the notice switches on during a session, Pundit stops and its highlights are removed from the page. When it switches off, Pundit starts again as on load (session lookup, then data), without a page reload.
- If the status cannot be read (timeout, error, invalid JSON), the client keeps the last valid status read in this page session. Without one, it shows no notice. The status never throws and never blocks the client by itself.
- Without `statusUrl` (or `STATUS_URL` in the extension), nothing changes: same UI, same calls.

## Capabilities

### New Capabilities

- `client-maintenance-notice`: how the client reads the remote maintenance notice, decides whether it applies, and shows it in place of Pundit while it lasts.

### Modified Capabilities

None.

## Impact

- **Code**:
  - `src/environments/configuration-types.ts` (`statusUrl`);
  - a new status model in `src/common/models` and a new `CrossMsgRequestId`;
  - the background request handler and the webpack configs (`STATUS_URL`);
  - the content script (`PunditLoaded` carries the extension's version);
  - a new maintenance service in `src/app/services`;
  - `AppComponent`, which renders the notice or Pundit, and a new notice component;
  - `en_US` translations.
- **Server (pundithomex)**: relies on the existing `GET /api/client-status` contract: CORS `*` on `api/*`, `Cache-Control: no-cache, no-store`, answered during `php artisan down`, no session or cookie, 60 requests a minute per IP. Nothing to build there.
- **Deployment (pundit-deployment)**: `render-env.sh` must write `statusUrl` into `local.*.ts` and `STATUS_URL` into `chrome-ext-urls.stage.js`. Nginx must not answer `/api/client-status` with a maintenance page of its own.
- **Release**: this version ships as 1.18.0 (stage 1.18.0.1) from `develop`, then is merged into `feature/new-be-api`.
