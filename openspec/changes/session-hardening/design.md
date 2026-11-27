## Context

In the extension the Angular app runs in the annotated page's own JavaScript world: the content script injects `pundit.chrome-ext.js` as a `<script>`. The app cannot call the API from there, so every model call decorated with `@CrossMessage` becomes a `CustomEvent` on `window`; the content script forwards it to the background service worker, which performs the request with the session cookie and the CSRF header and sends the answer back the same way (`src/common/cross-message.ts`, `content/handlers/onCrossMessageRequest.ts`, `background/helpers/doCrossMessageRequest.ts`).

Any script of the page can dispatch the same event. Today the worker:

- returns the whole axios response, request configuration included, so the `X-CSRF-TOKEN` it sent and the `csrf_token` of the sign-in answers reach the page;
- takes its API addresses from a message of the page (`InitCommunicationSettings`) and stores them for every tab;
- puts identifiers straight into URL paths;
- checks nothing about the sender.

The embed build has no relay: the app calls the API from the page it is embedded in, and the same model code runs directly (`crossMessageEnabled()` is false). The PDF viewer of the extension loads the embed bundle and does the same.

Social sign-in: `oauth-provider.service.ts` builds `<provider url>?client_id=…&redirect_uri=…&scope=…&response_type=code` and opens it in a popup. No `state` exists anywhere.

## Goals / Non-Goals

**Goals:**

- The page learns nothing from the relay beyond the answer's status and body.
- The relay sends requests only to the API the extension was built for, and only for the operations the app has.
- A social sign-in is started by the BE API, which can then bind the answer to the browser.
- The four reported defects are confirmed with a test and fixed.

**Non-Goals:**

- Running the app in the content script's isolated world or in an extension frame. That is the complete fix of the relay and a change of its own; this change does not make it harder.
- Removing operations from the relay.
- A time limit on relayed calls: a call the worker never answers still waits (deferred by the owner).
- Any change to the embed build's behaviour.

## Decisions

### D1. The relay answers with status and body only

`doCrossMessageRequest` sends back `{ status, data }` for a success and `{ response: { status, data } }` for a failure. When `data` is an object, its `csrf_token` property is left out. No caller in `src/app` or `src/common` reads `headers`, `config` or `csrf_token` from an answer; the token is read only inside `src/communication`, which in the extension runs in the worker.

This applies to the operations that call the BE API through a model of `src/common/models`. The worker's local operations (`extension.hasApiAccess`, `extension.requestApiAccess`, `clientStatus.get`, `analytics.trigger`) do not return an axios response but a boolean, `null`, or the public status JSON fetched without credentials; they are answered with that value unchanged. Each entry of the handler map says which kind it is; the answer's shape is not guessed, because the status JSON may itself have a `status` key.

*Alternative considered:* stripping only the header from `config`. Rejected: a list of what to remove grows stale; a list of what to send does not.

### D2. The worker's addresses come from the build

`background/main.ts` sets `CommunicationSettings.apiBaseUrl` and `authBaseUrl` once, from the webpack constants `API_BASE_URL` and `AUTH_BASE_URL`. `AUTH_BASE_URL` is new and is derived in both webpack files from `API_BASE_URL` with its trailing `api` removed, so the file that feeds the stage build needs no new key. The `InitCommunicationSettings` message is no longer forwarded by the content script nor handled by the worker, and the two storage keys are neither written nor read. This also removes the storage read that today runs after the request was already built, which made the first request after the worker restarts go out without a base URL.

The stored auth address was also read by `getApiOrigins()` in `background/helpers/apiAccess.ts`, the origin for which the worker checks and the site access page (`site-access.html`) requests the extension's host permission. It takes the origin from `AUTH_BASE_URL` too, so a page can no longer choose the origin the user is asked to allow.

### D3. Identifiers are checked where they enter

For every relay operation whose model method puts an argument into a URL path, the worker requires that argument to match `^[A-Za-z0-9_-]{1,64}$` before calling the model. A number is checked as its decimal string; any other type, or arguments that are not a list, do not match. A value that does not match is answered `{ response: { status: 400, data: { message: 'Invalid identifier' } } }` and nothing is sent. The check lives in the relay, not in `src/communication`: the embed build is not exposed to another party's arguments.

### D4. Only an active tab of this extension is served

`onContentScriptMessage` drops a message whose `sender.id` is not `chrome.runtime.id` or that has no `sender.tab`. `CrossMsgRequest` and `ImageDataRequest` are served only when the stored state of that tab is active. The app is only ever loaded into an active tab, so no legitimate request is lost.

### D5. Social sign-in opens the BE API's start route

`createOAuthURL` returns `provider.params.url` as it is. `OAuthParameters` keeps `url` only. `local.example.ts` sets it to `` `${authBaseUrl}login/google/pundit` `` and the same for `facebook` and `egi`. The popup's outcome is read as today. `transformer.helper.ts` maps `already_signed_in` to the new string `toast#login_already_signed_in_text`: "You are already signed in with another account. Sign out first."

### D7. Reported defects

Each task starts from a test of the expected behaviour; if it passes on the current code the report was wrong and only the test stays.

- `NotebookService.setSelected` builds an observable with `catchError` and never subscribes: a failed change of the current notebook is never handled. Expected: the failure restores the previous selection and shows the existing error toast. Note: the BE API now also accepts as current a notebook shared with the user with write access (the client already offers those); a read-only share still answers 422. Confirmed: the request was sent but its failure never handled. A refusal reaches the client only in rare cases, because the client offers only its own and writable notebooks: the write access revoked or the notebook deleted while the list is open, a network error. The callers (notebook panel, edit modal, annotation menu) update their view before the answer, and the panel and the annotation menu also show a success toast; on a refusal the service restores the previous selection, unless another one was chosen meanwhile, emits `selectedChanged$`, on which the sidebar redraws the notebook panel, and shows `toast#notebookchangecurrent_error_*` after the optimistic success toast.
- `checkActiveState.handleFeedWeb` calls `chrome.tabs.update` without a tab id, which navigates whichever tab is focused. Expected: the tab the check ran for.
- An annotation edit closes the editor before the update is answered. Expected: on a refused update the editor is still open with the user's text.

Checked while writing this design, not a defect: the stage build's status URL. `webpack.chrome-ext.stage.js` has its own default `STATUS_URL`, and the generated file only overrides the keys it names.

## Risks / Trade-offs

- [A tab's stored state says inactive while the app is loading] → D4 would drop its first requests. The state is written before the content script is told to load the app; the spec pins the order with a test.
- [An identifier format the pattern does not cover] → D3 would refuse a legitimate call. The pattern covers the BE API's ULIDs, the identifiers kept from the annotation server and numeric user ids; the spec tests one of each.
- [A build against a BE API without the start route] → social sign-in fails with the popup's generic error. The two ship together.
- [The page can still invoke every relay operation as the user] → accepted for this change; see Non-Goals.

## Open Questions

- The feed redirect also switches Pundit on in that tab without a click. Whether a page reached that way should need the click is left to the change that isolates the app.
