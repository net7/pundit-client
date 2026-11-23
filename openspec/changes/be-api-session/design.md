## Context

The client reaches its backend through `src/communication`: `rest.provider.ts` builds every request with axios and the fetch adapter, and `CommunicationSettings` holds the base URLs and the Bearer token. `authBaseUrl` (`<APP_URL>/`) serves the auth routes, and `apiBaseUrl` serves annotations, notebooks, replies, reactions and searches. The token comes from the email login, from `POST api/auth/me` (a user already signed in to the web application) or from the social sign-in popup, and `refreshHook` renews it on a 401.

The client runs in three builds:

- **Chrome extension.** The content script relays every request to the background service worker (`doCrossMessageRequest`), which runs the networking layer. The extension's own PDF viewer page (`chrome-extension://…/pdf-viewer.html`) has no cross messaging and calls the backend directly.
- **Embed bundle.** Used by the feed, on the application's site.
- **Standalone PDF viewer.** Also on the application's site.

The new BE API serves everything under `<APP_URL>/api`, with the annotation server's paths (`/annotation`, `/notebook/{id}/share`, `/social/do`, …). Identity is the application's session cookie (`SameSite=None; Secure`), and the CSRF token is bound to that session.

## Goals / Non-Goals

**Goals:**

- All three builds talk only to the new BE API.
- Every way in keeps working in every build: email and password, registration with the existing email-verification flow, Google / Facebook / EGI in a popup, recognising a user already signed in to the web application, signing out.
- What the user sees stays the same, except for the differences listed under Risks / Trade-offs, which come from the new BE API.
- The adaptation stays in `src/communication` and in the login module. Components and handlers keep building the objects they build today.

**Non-Goals:**

- Supporting the annotation server, behind a switch or otherwise.
- New UI, new messages or new i18n strings.
- Using what the new BE API returns in addition (`facets`, `meta`, `color` kept on create, the resource returned by a write).
- Changes to the new BE API itself.

## Decisions

### D1. Session cookie on every request

Every request is sent with `withCredentials: true`, which the fetch adapter turns into `credentials: 'include'`. The `Authorization` header, `AuthToken` in `CommunicationSettings`, `refresh.ts` and every `refreshHook` are removed.

A single `anonymous` request option replaces `skipAuth`: no cookies and no CSRF header. Only the public search uses it (D9).

This holds in the extension too. The service worker has host permission on `<all_urls>`, so CORS does not apply to it, and the cookie is `SameSite=None; Secure`, so it is attached. The extension page calls with `credentials: 'include'` like the embed. The embed and the standalone PDF viewer run on the application's own site, and the new BE API's CORS allows the application and feed origins with credentials.

*Alternative considered:* keeping a Bearer token for the extension. The new BE API issues no tokens to the client, so a second credential would have nothing to carry.

### D2. CSRF token: one per session, kept in the settings

`CommunicationSettings` keeps the latest CSRF token it received. Sources, in order of preference:

1. the `csrf_token` in the login response;
2. the `csrf_token` in the `GET /api/user` response;
3. `GET /api/csrf` → `{csrf_token}`, open to guests.

Every non-GET sends `X-CSRF-TOKEN`: the two search POSTs, the login and guest requests included. When a non-GET has no token, the provider fetches one first. Concurrent requests share a single in-flight `GET /api/csrf`, so two writes fired together cause one fetch. Logout drops the stored token, and the next non-GET fetches a new one.

In the extension, the token lives in the service worker's `CommunicationSettings` and is shared by every tab, like the Bearer token was. The extension's PDF viewer page keeps its own.

### D3. 419: renew and retry once

On a 419, the provider fetches a fresh token from `GET /api/csrf` and sends the same request again, once. A second 419 is an error like any other. This covers a token rotated by a sign-in or sign-out in another tab of the web application.

### D4. Auth routes

| Purpose | Request | Answer |
|---|---|---|
| Who is signed in | `GET api/user` | `{userinfo, csrf_token}`; 401 `{"error": "Unauthorized"}` for a guest or an unconfirmed account |
| Email login | `POST api/auth/login` | `{userinfo, csrf_token}`; 422 `must_accept_terms`, 422 `must_verify_email`, 401 |
| Registration | `POST api/user/register` | 422 `must_verify_email` on success |
| Sign out | `POST api/auth/logout` | 200 |
| Current notebook | `POST api/auth/edit_current_notebook/{id}` | 200 |
| New verification link | `POST api/auth/resend_verification_mail` | 200 |
| CSRF token | `GET api/csrf` | `{csrf_token}` |

The auth routes are reached through `authBaseUrl` (`<APP_URL>/`), so they resolve under the same `/api` prefix. These routes keep the `{error}` body the login module already reads. The annotation routes answer `{message}` (plus `errors` on 422), which the client only shows through its generic toast.

### D5. Social sign-in: the popup reports, the session answers

The client still builds the provider URL and opens it in a popup. Before closing, the backend's callback posts one message to `window.opener` with target `'*'`, because in the extension the opener can be any site. The message carries no secret:

```js
{ source: 'pundit-login', status: 'ok' }
{ source: 'pundit-login', status: 'error', error: '<code or sentence>' }
```

The client accepts a message only when `event.origin` is the application's origin (`POPUP_ORIGIN`) **and** `data.source === 'pundit-login'`.

- `ok`: `GET /api/user` with cookies, then the existing success path. The answer's `csrf_token` is kept, since the sign-in started a new session. If this lookup fails, the generic "sign-in failed" text is shown.
- `error`: the existing "sign-in failed" toast, with its retry action. `provider_failed`, `Unauthorized` and `General error` map to the existing generic text (`toast#login_error_text`). Any other value is a sentence chosen by the backend (for example a provider account that does not share an email address) and is shown as it is.
- No message (popup closed, sign-in cancelled at the provider): nothing happens, as today. The listener is replaced at the next open, and `window.closed` is not watched.

### D6. Refused fields are stripped at the call site that sends them

The new BE API answers 422 to fields it does not accept. The app keeps building today's objects, and each `src/communication` function that sends a body removes them:

- `userId` from every annotation, notebook, reply and social body;
- `userWithReadAccess`, `userWithWriteAccess` and the pending invitation lists from notebook create and update. Only `label` and `sharingMode` are sent;
- `parentId` from reply create and update. Reply update sends `{comment}`, plus `type` and the unchanged `annotationId` when present.

`parentId` on `social/do` and `social/undo` stays: there it names the reply a reaction is about.

A shared `withoutFields` helper does the stripping, so each call site states the fields it removes.

*Alternative considered:* changing the services that build the bodies. That spreads the change across the app for no visible gain, and the services would still build the sharing lists for their other uses.

### D7. Paging

Searches send `page` (from 1) and `size`. The search builder no longer has `from`. The sidebar asks for page 1 with size 200, and the notebook list for page 1 with size 50: the same sets shown today. Since the client asks only for page 1, it never reaches the 404 the new BE API answers for a page past the last. See Open Questions about the sidebar's size.

### D8. Write responses

A write now answers with the resource instead of `{id}`. The resource has `id`, so every `response.data.id` the app reads keeps working, and the fetch that follows a write today stays.

### D9. Extension badge request stays public and anonymous

The badge count (`doPageAnnotationsRequest`) counts a page's public annotations. It keeps its cache and goes out with the `anonymous` option: no cookies, no CSRF header. The background no longer clears and restores a token around it. See Open Questions: the new BE API currently refuses this request.

### D10. Errors look as they do today

The generic error toast stays. Behind it:

- 419 is handled invisibly (D3);
- 401 keeps today's flow: signed out, public data reloaded;
- 403 keeps today's handling in `main-layout.eh.ts`, which signs the user out. The new BE API answers 403 to a write without permission and to a banned account, as the annotation server did for the former. An unconfirmed account never gets this far: `GET /api/user` answers 401 for it and its login answers `must_verify_email`, which the verification flow already handles;
- 429 and 503 show the generic toast.

### D11. Identifiers starting with a digit

The new BE API's ids are ULIDs, which can start with a digit. A CSS selector such as `textarea#<id>` throws on them. The reply textarea is therefore found by its `id` attribute, never by an `#id` selector. The reply and the social action bar are OnPush components, so they mark themselves for check after their async saves. That way the reply form closes and the reply count moves once a save completes.

### D12. Build defaults and release check

The build configuration files are generated by the deployment tooling and ignored by git. The committed defaults change:

- `webpack.chrome-ext.prod.js` falls back to `https://app.thepund.it/api`, and `webpack.chrome-ext.stage.js` to `https://app.thepund.netseven.work/api`;
- `src/environments/local.example.ts` shows one host for both URLs, `apiBaseUrl` being that host plus `/api`.

`scripts/deploy/env-check.js` expects the application's host in the generated environment files, and refuses a build that still names the annotation server's host (`api.thepund.*`) or the other environment's host. Updating the generator is a deployment task.

## Risks / Trade-offs

- **Differences the user can see, which come from the new BE API.** Pending invitation addresses of a notebook reach only its owner. User names are the name a person is shown under, never an email address (the sharing modal still shows the email of people you share with). The sidebar search counts exactly past 10,000 and walks every page, so it can show annotations the annotation server dropped. `removeShare` in read-only mode removes the share.
- **A failed social sign-in becomes visible.** It used to close the popup without a word. Now the existing "sign-in failed" toast appears. No new string is involved.
- **A late response can sign the browser out.** Every response sets the session cookie again. If a guest request is still in flight when the user signs in and its answer arrives after the login's, the guest cookie comes back, and the next call is a 401. The window is narrow (the sidebar's first search at the moment of signing in). The fix belongs to the backend.
- **`window.opener` may not survive the provider round trip.** A provider page that sends `Cross-Origin-Opener-Policy: same-origin` severs it, and the callback can then post nothing: a social sign-in shows nothing. The token flow it replaces had the same dependency. This needs checking on stage with real provider apps.
- **No way back but git.** A build from this change works only against the new BE API, so it ships with it.

## Migration Plan

1. Merge and release together with the new BE API, never before.
2. The deployment tooling writes `<APP_URL>/api` into the generated environment files. Until then, the release check refuses the build.
3. Rollback: redeploy the previous client release together with the annotation server.

## Open Questions

### Q1. The extension badge count

The badge counts a page's public annotations with an anonymous `POST /api/annotation/search` from the service worker: no cookies, so that it counts what a guest sees whatever the user's session. The new BE API requires `X-CSRF-TOKEN` on every non-GET. The token is bound to a session cookie, so a cookieless request cannot carry a valid one and gets 419. Until this is settled, the request fails, the failure is caught and logged in the service worker, and the badge stays empty.

Options:

- **(a) The new BE API exempts a cookieless `POST /api/annotation/search` from the CSRF check.** A request without a session cookie carries no ambient authority, so there is nothing to forge. The badge stays the public count, as today, with no client change beyond D9. Needs a change on the backend side.
- **(b) The badge searches with the worker's session.** No backend change is needed, but the badge would count what the signed-in user can read rather than the page's public annotations, and every page visit would spend the user's request quota (100 a minute, shared by every `/api` call).
- **(c) `GET /api/w3c/search`, which needs no CSRF token.** It filters by URL only, not by the page's canonical metadata, so it can count differently from the sidebar.

Leaning (a). The decision is pending.

### Q2. The sidebar's page size

The sidebar loads one page of 200 annotations and shows nothing past it. The new BE API accepts `size` from 1 to 500. Options:

- **(a) Keep 200.** The same set is shown as today.
- **(b) Ask for 500.** Busy pages show up to 500 annotations, at the cost of a heavier first response.
- **(c) Walk the pages** (`meta.pages`) until all are loaded. Every annotation is shown, but this changes the loading behaviour and needs a cap of its own.

Until this is decided, D7 keeps 200. The notebook list (50) is not affected.
