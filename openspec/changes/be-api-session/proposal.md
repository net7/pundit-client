## Why

The annotation server is being retired. Annotations, notebooks, replies, reactions and the sign-in now all live behind one API on the application's own host, under `<APP_URL>/api`: the new BE API. It keeps the annotation server's paths and response shapes, but it authenticates with the application's session cookie instead of a Bearer token, asks for a CSRF token on every request that is not a GET, and refuses some request fields that the annotation server ignored or wrongly applied.

The client has to move to it without the user noticing anything: same sign-in options, same screens, same data.

## What Changes

- **BREAKING** The networking layer (`src/communication`) talks only to the new BE API. The Bearer token, the token refresh and the `skipAuth` option go away. There is no switch back to the annotation server.
- Every request sends the session cookie. Every non-GET sends `X-CSRF-TOKEN`. The token is fetched from `GET /api/csrf` before the first write that has none, replaced by the token the login and `GET /api/user` return, and dropped at logout. A 419 fetches a fresh token and retries once.
- The auth calls follow the new routes: `GET /api/user` replaces `POST /api/auth/me`, logout and "change current notebook" become `POST`, refresh is gone.
- Request bodies leave out what the new BE API refuses: `userId` everywhere; the sharing lists on notebook create and update; `parentId` on replies. Renaming a notebook therefore no longer clears its shares.
- Searches page with `page` (counting from 1) and `size`. `from` is no longer sent.
- Social sign-in reads the popup's outcome message (`{source: 'pundit-login', status, error?}`) and then asks `GET /api/user` who signed in. The popup no longer hands over a token, and a failed social sign-in now shows the existing "sign-in failed" toast.
- Element ids that start with a digit (the new BE API's ULIDs) work wherever the client looks them up in the DOM.
- The extension's fallback API URL and `local.example.ts` point at `<APP_URL>/api`. The release check refuses a build that still names the annotation server's host.

## Capabilities

### New Capabilities

- `api-session`: how the client signs in, stays signed in and signs out against the new BE API: session cookie, CSRF token and its renewal, the auth routes, the social sign-in popup's outcome message, and error statuses.
- `api-request-contract`: what the client sends and reads on the annotation, notebook, reply, social and search routes: refused fields, paging, write responses, identifiers.
- `api-endpoints`: where each build points by default, and the release check that guards it.

### Modified Capabilities

- `in-repo-communication-layer`: the layer no longer reproduces the old package's requests byte for byte, and its unit tests cover the session flows (cookies, CSRF, 419 retry, auth routes) in place of the Bearer token, refresh and SSO token handling.

## Impact

- `src/communication`: `providers/rest.provider.ts`, `services/configuration.service.ts`, `auth/*` (`refresh.ts` removed, `session.ts` added), the create/update calls of `annotation`, `notebook`, `reply` and `social`, the search request builder and its parameter interfaces, the auth response models (`AuthToken` removed).
- Login module: `transformer.helper.ts`, `popup.service.ts`, `oauth-provider.service.ts`, `email-provider.service.ts`.
- Models: `annotation-model.ts` and `notebook-model.ts` (search paging).
- Chrome extension background: `doPageAnnotationsRequest.ts`, `onContentScriptMessage.ts` (no token juggling around the badge request).
- Reply UI: `reply.ts`, `reply-textarea.helper.ts`, `social-action-bar.ts` (ids starting with a digit; OnPush updates after async saves).
- Build: `webpack.chrome-ext.{stage,prod}.js`, `src/environments/local.example.ts`, `scripts/deploy/config.js`, `scripts/deploy/env-check.js`.
- Deployment: this change ships together with the new BE API; a build from it does not work against the annotation server.
- Out of scope: any change to the new BE API; new UI or i18n strings; reading the extra fields the new BE API returns (`facets`, `meta`, the resource on writes).
