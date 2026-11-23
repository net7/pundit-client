## 1. Request provider and session

- [x] 1.1 `CommunicationSettings`: replace the token with `csrfToken`; drop `AuthToken` from the models and the index
- [x] 1.2 `rest.provider.ts`: `withCredentials: true` on every request; `anonymous` option (no credentials, no CSRF header) replacing `skipAuth`; no `Authorization` header (design D1)
- [x] 1.3 `rest.provider.ts`: `X-CSRF-TOKEN` on every non-GET; lazy `GET api/csrf` with one shared in-flight fetch (design D2)
- [x] 1.4 `rest.provider.ts`: on 419, fetch a fresh token and retry once; a second 419 is rethrown (design D3)
- [x] 1.5 Remove `auth/refresh.ts` and every `refreshHook` from the call sites
- [x] 1.6 Specs: credentials and no `Authorization`; `anonymous`; one `GET api/csrf` for two concurrent writes; GET without token; 419 retry and second 419; `hooks.after` and `retry$`

## 2. Auth routes

- [x] 2.1 `auth/session.ts` (`sso`): `GET api/user` on `authBaseUrl`, stores `csrf_token`, keeps the `ssoLoading$` gate (design D4)
- [x] 2.2 `auth/login.ts`: store the login's `csrf_token`; `auth/signup.ts` and `auth/resend-verification-mail.ts` go through the CSRF path
- [x] 2.3 `auth/logout.ts`: `POST api/auth/logout`, then clear the stored token
- [x] 2.4 `notebook/set-default.ts`: `POST api/auth/edit_current_notebook/{id}`
- [x] 2.5 Auth response models: `{userinfo, csrf_token}`; `transformer.helper.ts` reads no token fields
- [x] 2.6 Specs: session lookup stores the token and releases the gate on success and failure; login stores its token; logout clears it and the next write fetches a new one

## 3. Request bodies and paging

- [x] 3.1 `providers/without-fields.ts`: shallow copy without the named fields (design D6)
- [x] 3.2 Annotation create/update, reply create/update, social do/undo: no `userId`; replies without `parentId`; reply update `{comment, type?, annotationId?}`; `parentId` kept on social
- [x] 3.3 Notebook create/update: only `label` and `sharingMode`
- [x] 3.4 Search builder and parameter interfaces: `page` (from 1) and `size`, no `from`; `annotation-model.ts` asks page 1 size 200, `notebook-model.ts` page 1 size 50 (design D7)
- [x] 3.5 Specs: exact bodies for each create/update (a notebook rename with sharing lists sends `{label, sharingMode}`); search params carry `page` and no `from`

## 4. Social sign-in popup

- [x] 4.1 `popup.service.ts`: accept only `event.origin === POPUP_ORIGIN` and `data?.source === 'pundit-login'` (design D5)
- [x] 4.2 `oauth-provider.service.ts`: on `ok` call the session lookup and continue the existing success path; on `error` emit the existing failure with the code or sentence
- [x] 4.3 `transformer.helper.ts`: map `provider_failed`, `Unauthorized`, `General error` and a failed session lookup to `toast#login_error_text`; any other value shown as it is
- [x] 4.4 Specs: `ok` triggers the lookup; `error` with a code and with a sentence; foreign origin, missing `source` and `data` null ignored; no message shows nothing

## 5. Extension badge

- [x] 5.1 `doPageAnnotationsRequest.ts`: the public search goes out with `anonymous`; the cache stays (design D9)
- [x] 5.2 `onContentScriptMessage.ts`: no token cleared or restored around the badge request
- [x] 5.3 Specs: the badge search is anonymous and leaves the stored CSRF token untouched; a failure is logged and the badge stays empty

## 6. Identifiers starting with a digit

- [x] 6.1 `reply-textarea.helper.ts`: find the textarea by its `id` attribute, not by an `#id` selector (design D11)
- [x] 6.2 `reply.ts`, `social-action-bar.ts`: mark for check after async saves, so the form closes and the count updates
- [x] 6.3 Specs: an id starting with a digit; the form closes and the count moves after a save

## 7. Build defaults and release check

- [x] 7.1 `webpack.chrome-ext.{prod,stage}.js`: default `API_BASE_URL` to the application's `/api` (design D12)
- [x] 7.2 `src/environments/local.example.ts`: one host for both URLs, `apiBaseUrl` with `/api`
- [x] 7.3 `scripts/deploy/config.js`, `env-check.js`: application hosts expected; `forbiddenApiHosts` lists the other environment and the annotation server
- [x] 7.4 `env-check.test.js`: a file naming `api.thepund.*` is refused with file and host; correct files pass

## 8. Verification

- [x] 8.1 `npx jest` green; `npx tsc --noEmit` and lint clean
- [x] 8.2 All six builds compile (`build:chrome-ext-*`, `build:embed-*`, `build:pdf-standalone-*`, stage and prod); the stage bundles contain the application's `/api` and no `api.thepund.*`
- [ ] 8.3 Extension against a local stack: sign in by email, sidebar on an annotated page, create / edit / delete an annotation, reply, reaction, notebook create / rename with shares kept / share / remove share / set current / delete, sign out, guest sidebar. Every call carries the session cookie and no `Authorization`, and every non-GET carries `X-CSRF-TOKEN`
- [ ] 8.4 Extension recognises a user already signed in to the web application; 419 after a sign-in in another tab is retried invisibly
- [ ] 8.5 Extension's own PDF viewer, embed through the feed, standalone PDF viewer: annotations load and save
- [ ] 8.6 Social sign-in on stage with real provider apps: success, cancel, provider failure; `window.opener` survives the provider round trip

## 9. Open questions

- [ ] 9.1 Decide the extension badge count (design Q1) and apply the decision
- [ ] 9.2 Decide the sidebar's page size (design Q2) and apply the decision
