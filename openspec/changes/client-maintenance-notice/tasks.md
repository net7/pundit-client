## 1. Configuration and version

- [x] 1.1 Add optional `statusUrl` to `LocalConfig` (`configuration-types.ts`) and to `local.example.ts`
- [x] 1.2 Add `STATUS_URL` to the `DefinePlugin` of `webpack.chrome-ext.prod.js` (`https://app.thepund.it/api/client-status`) and `webpack.chrome-ext.stage.js` (default `https://app.thepund.netseven.work/api/client-status`, override from `chrome-ext-urls.stage.js`), and declare it in the background
- [x] 1.3 Send `version: chrome.runtime.getManifest().version` with `PunditLoaded` (`loadExtension.ts`) and store it as `clientVersion` in `ChromeExtService`
- [x] 1.4 Add a `getClientVersion()` helper: manifest in extension pages, `clientVersion` from config on web pages, `package.json` elsewhere

## 2. Status read and parsing

- [x] 2.1 Write unit tests for `parseClientStatus`: valid empty, valid notice, unknown fields, unknown level, `active: false`, missing `id`/`level`, `version: 2`, no `notices`, not an object
- [x] 2.2 Write unit tests for `noticeApplies`: no `appliesTo`, 1.18.0 ≤ 1.18.0, 1.18.0.1 vs 1.18.0, 1.19.0 and 1.19.0.2 vs 1.18.0, `"1.18"` prefix, invalid `maxClientVersion`, unknown client version
- [x] 2.3 Implement `parseClientStatus` and `noticeApplies` as pure helpers in `src/app/helpers`
- [x] 2.4 Add `CrossMsgRequestId.ClientStatusGet` and `ClientStatusModel.get()` in `src/common/models` (fetch with `credentials: 'omit'`, `cache: 'no-store'`, `referrerPolicy: 'no-referrer'`, cache-busting query, 3 s abort, `null` on any failure)
- [x] 2.5 Map `ClientStatusGet` in the background `doCrossMessageRequest.ts` to `ClientStatusModel.get()` with `STATUS_URL`, ignoring request args
- [x] 2.6 Unit tests for `ClientStatusModel.get()` with a stubbed `fetch`: request options and query, timeout, 404, 429, invalid JSON, network error

## 3. MaintenanceService

- [x] 3.1 Write unit tests: no URL → no request and no notice; 60 s cache; forced refresh; last valid status kept on failure; no notice on first failure; switch-off emits `null`; hidden page skips polling; page-side 3.5 s timeout; `ready()` resolves on failure; `texts$`
- [x] 3.2 Implement `MaintenanceService` (`notice$`, `texts$`, `ready()`, `refresh(force?)`, 5-minute polling with visibility check, `texts()`)

## 4. Notice in place of Pundit

- [x] 4.1 `AppComponent`: start the service, wait for the first read when a status URL is configured, render the notice or `main-layout`
- [x] 4.2 On switch-on during a session, hide the tooltip, remove the highlights and the loaded annotations, and the expanded-sidebar body class
- [x] 4.3 `AppComponent` tests: no URL starts at once; waits for the first read; notice in place of Pundit; switch-on clears the page; switch-off starts Pundit again

## 5. UI

- [x] 5.1 Add the `maintenance#*` keys in `en_US.maintenance.ts`, spread into `en_US.ts`
- [x] 5.2 Create the standalone OnPush `pnd-maintenance-notice` component: Pundit-style sidebar (logo toggle, header status, disabled actions, notice with `role="alert"`, logo dot when collapsed) and a warning toast; its styles
- [x] 5.3 Component tests: maintenance, outdated extension and outdated embed texts; header status and disabled actions; toast; collapse from logo and close button; cleanup on destroy; nothing rendered without a notice

## 6. Verification

- [x] 6.1 `npm test`, `npm run lint` and stylelint on the new stylesheet pass
- [ ] 6.2 Build `chrome-ext-stage` and `embed-stage`; run the manual test of design.md (static file: on, `maxClientVersion` 1.18.0 and 1.17.0, off without reload, on again during a session, server stopped)
- [ ] 6.3 With no `statusUrl`/`STATUS_URL`, confirm in the Network panel that the calls are the same as on `develop`
- [ ] 6.4 Note for pundit-deployment: `statusUrl: '<APP_URL>/api/client-status'` in the `local.*.ts` templates and `STATUS_URL` in `chrome-ext-urls.stage.js`
